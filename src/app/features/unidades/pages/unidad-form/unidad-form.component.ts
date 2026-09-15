import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { EMPTY, Observable, catchError, expand, finalize, map, of, reduce, switchMap } from 'rxjs';

import { isProblemDetail } from '../../../../core/api/problem-detail.model';
import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { PageResponse } from '../../../personas/models/persona.model';
import { PropiedadApiService } from '../../../propiedades/data/propiedad-api.service';
import { Propiedad, PropiedadListFilters } from '../../../propiedades/models/propiedad.model';
import { formatPropiedadInvestment } from '../../../propiedades/utils/propiedad-formatters';
import { UnidadFotosManagerComponent } from '../../components/unidad-fotos-manager/unidad-fotos-manager.component';
import { UnidadApiService } from '../../data/unidad-api.service';
import { UnidadEstadoOperativo, UnidadRequest, UnidadResponse } from '../../models/unidad.model';
import {
  UnidadListContext,
  parseUnidadListContext,
  serializeUnidadListContext,
} from '../../utils/unidad-list-context';

export type UnidadFormMode = 'create' | 'edit';

interface UnidadFormValue {
  readonly nombre: string;
  readonly tipoUnidad: string;
  readonly descripcion: string;
  readonly area: number | null;
  readonly dormitorios: number | null;
  readonly banos: number | null;
  readonly piso: number | null;
  readonly ubicacionInterna: string;
  readonly precioBase: number | null;
  readonly estadoOperativo: UnidadEstadoOperativo | null;
}

type UnidadFormControls = {
  [Field in keyof UnidadFormValue]: FormControl<UnidadFormValue[Field]>;
};

type UnidadFormField = keyof UnidadFormValue;

interface LoadedUnitContext {
  readonly unit: UnidadResponse;
  readonly property: Propiedad | null;
}

const UNIT_TYPE_OPTIONS = [
  { value: 'CASA', label: 'Casa' },
  { value: 'DEPARTAMENTO', label: 'Departamento' },
  { value: 'TIENDA', label: 'Tienda' },
  { value: 'OTRO', label: 'Otro' },
] as const;

type UnidadTipoOption = (typeof UNIT_TYPE_OPTIONS)[number]['value'];
type UnidadTipoSelection = UnidadTipoOption | '';

const notBlankValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  String(control.value ?? '').trim() ? null : { required: true };

const integerValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value as number | null;

  return value === null || Number.isInteger(value) ? null : { integer: true };
};

@Component({
  selector: 'app-unidad-form',
  imports: [MatIconModule, ReactiveFormsModule, UnidadFotosManagerComponent],
  templateUrl: './unidad-form.component.html',
  styleUrl: './unidad-form.component.css',
})
export class UnidadFormComponent {
  private readonly api = inject(UnidadApiService);
  private readonly propiedadApi = inject(PropiedadApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notification = inject(OrmanNotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly requestedCoduni = this.route.snapshot.paramMap.get('coduni');
  private readonly requestedCodprop = this.route.snapshot.queryParamMap.get('codprop');
  private readonly coduni = this.parseIdentifier(this.requestedCoduni);

  @ViewChild(UnidadFotosManagerComponent)
  private photoManager?: UnidadFotosManagerComponent;

  protected readonly mode = signal<UnidadFormMode>(
    this.requestedCoduni === null ? 'create' : 'edit',
  );
  protected readonly loading = signal(this.mode() === 'edit');
  protected readonly loadingError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly submitAttempted = signal(false);
  protected readonly feedback = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});
  protected readonly properties = signal<readonly Propiedad[]>([]);
  protected readonly selectedPropertyId = signal<number | null>(
    this.parseIdentifier(this.requestedCodprop),
  );
  protected readonly selectedProperty = computed(() => {
    const selectedId = this.selectedPropertyId();

    return this.properties().find((property) => property.codprop === selectedId) ?? null;
  });
  protected readonly propertyLoading = signal(false);
  protected readonly propertyError = signal<string | null>(null);
  protected readonly associatedProperty = signal<Propiedad | null>(null);
  protected readonly loadedUnit = signal<UnidadResponse | null>(null);
  protected readonly unitTypeOptions = UNIT_TYPE_OPTIONS;
  protected readonly selectedUnitTypeOption = signal<UnidadTipoSelection>('');
  protected readonly showCustomUnitType = computed(() => this.selectedUnitTypeOption() === 'OTRO');
  protected readonly form = new FormGroup<UnidadFormControls>({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [notBlankValidator, Validators.maxLength(100)],
    }),
    tipoUnidad: new FormControl('', {
      nonNullable: true,
      validators: [notBlankValidator, Validators.maxLength(50)],
    }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
    area: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)],
    }),
    dormitorios: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0), integerValidator],
    }),
    banos: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0), integerValidator],
    }),
    piso: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0), integerValidator],
    }),
    ubicacionInterna: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(150)],
    }),
    precioBase: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)],
    }),
    estadoOperativo: new FormControl<UnidadEstadoOperativo | null>(1, {
      validators: [Validators.required, this.operationalStatusValidator],
    }),
  });

  constructor() {
    if (this.isEdit()) {
      this.loadUnit();
      return;
    }

    this.loadProperties();
  }

  protected isEdit(): boolean {
    return this.mode() === 'edit';
  }

  protected title(): string {
    return this.isEdit() ? 'Editar unidad' : 'Añadir unidad';
  }

  protected description(): string {
    return this.isEdit()
      ? 'Actualiza la información registrada de la unidad.'
      : 'Registra una unidad dentro de una propiedad.';
  }

  protected statusLabel(status: UnidadEstadoOperativo): string {
    return status === 1 ? 'Operativa' : 'No operativa';
  }

  protected formatPrice(value: number | null): string {
    return value === null ? 'Precio pendiente' : formatPropiedadInvestment(value);
  }

  protected fieldMessage(field: UnidadFormField): string | null {
    const control = this.form.controls[field];

    if (control.invalid && (control.touched || this.submitAttempted())) {
      return this.clientFieldMessage(field, control);
    }

    return this.fieldErrors()[field] ?? null;
  }

  protected propertyMessage(): string | null {
    if (this.selectedPropertyId() !== null || !this.submitAttempted()) {
      return null;
    }

    return 'Selecciona una propiedad para registrar la unidad.';
  }

  protected selectProperty(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    const codprop = Number(selectedValue);

    this.selectedPropertyId.set(this.isValidIdentifier(codprop) ? codprop : null);
  }

  protected selectUnitType(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;

    if (!this.isUnitTypeSelection(selectedValue)) {
      return;
    }

    this.selectedUnitTypeOption.set(selectedValue);
    this.form.controls.tipoUnidad.setValue(selectedValue === 'OTRO' ? '' : selectedValue);
    this.form.controls.tipoUnidad.markAsDirty();
  }

  protected cancel(): void {
    if (this.submitting()) {
      return;
    }

    this.goToList(this.isEdit() ? (this.loadedUnit()?.codprop ?? null) : this.selectedPropertyId());
  }

  protected submit(): void {
    this.submitAttempted.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting() || (!this.isEdit() && !this.selectedPropertyId())) {
      return;
    }

    const request = this.buildRequest();
    if (!request) {
      return;
    }

    this.submitting.set(true);
    this.feedback.set(null);
    this.fieldErrors.set({});

    const request$ = this.isEdit()
      ? this.api.update(this.coduni!, request)
      : this.api.create(this.selectedPropertyId()!, request);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (unit) => {
        if (this.isEdit()) {
          this.submitting.set(false);
          this.notification.success('Unidad actualizada correctamente.');
          this.navigateToDestination(
            ['/app/unidades', unit.coduni, 'detalle'],
            this.listContext(unit.codprop),
          );
          return;
        }

        (this.photoManager?.persistPendingPhotos(unit) ?? of({ failures: 0 })).subscribe({
          next: ({ failures }) => {
            this.submitting.set(false);

            if (failures > 0) {
              this.notification.warning(
                `La unidad se creó, pero ${failures} fotografía${failures === 1 ? '' : 's'} no pudo${failures === 1 ? '' : 'ieron'} guardarse. Puedes intentarlo nuevamente desde Editar unidad.`,
              );
              this.navigateToDestination(
                ['/app/unidades', unit.coduni, 'editar'],
                this.listContext(unit.codprop),
              );
              return;
            }

            this.notification.success('Unidad creada correctamente.');
            this.goToList(unit.codprop);
          },
          error: () => {
            this.submitting.set(false);
            this.notification.warning(
              'La unidad se creó, pero no se pudieron guardar las fotografías. Puedes intentarlo nuevamente desde Editar unidad.',
            );
            this.navigateToDestination(
              ['/app/unidades', unit.coduni, 'editar'],
              this.listContext(unit.codprop),
            );
          },
        });
      },
      error: (requestError: unknown) => {
        this.submitting.set(false);
        this.consumeSaveError(requestError);
      },
    });
  }

  private loadUnit(): void {
    if (this.coduni === null) {
      this.loading.set(false);
      this.loadingError.set('El identificador de la unidad no es válido.');
      return;
    }

    this.api
      .get(this.coduni)
      .pipe(
        switchMap((unit) =>
          this.propiedadApi.get(unit.codprop).pipe(
            map((property): LoadedUnitContext => ({ unit, property })),
            catchError(() => of<LoadedUnitContext>({ unit, property: null })),
          ),
        ),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ unit, property }) => {
          this.loadedUnit.set(unit);
          this.associatedProperty.set(property);
          const normalizedUnitType = this.normalizeUnitTypeValue(unit.tipoUnidad);

          this.form.reset({
            nombre: unit.nombre,
            tipoUnidad: normalizedUnitType,
            descripcion: unit.descripcion ?? '',
            area: unit.area,
            dormitorios: unit.dormitorios,
            banos: unit.banos,
            piso: unit.piso,
            ubicacionInterna: unit.ubicacionInterna ?? '',
            precioBase: unit.precioBase,
            estadoOperativo: unit.estadoOperativo,
          });
          this.setUnitTypeSelection(normalizedUnitType);
          this.form.markAsPristine();
          this.form.markAsUntouched();
        },
        error: (requestError: unknown) => {
          this.loadingError.set(this.loadErrorMessage(requestError));
        },
      });
  }

  private loadProperties(): void {
    this.propertyLoading.set(true);
    this.propertyError.set(null);

    this.loadAllProperties()
      .pipe(
        finalize(() => this.propertyLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (properties) => this.properties.set(properties),
        error: (requestError: unknown) => {
          this.properties.set([]);
          this.propertyError.set(
            this.errorMessage(requestError, 'No fue posible cargar las propiedades.'),
          );
        },
      });
  }

  private loadAllProperties(): Observable<readonly Propiedad[]> {
    return this.loadPropertyPage(0).pipe(
      expand((page) => {
        const nextPage = page.page + 1;

        return nextPage < page.totalPages ? this.loadPropertyPage(nextPage) : EMPTY;
      }),
      reduce((properties, page) => [...properties, ...page.content], [] as Propiedad[]),
    );
  }

  private loadPropertyPage(page: number): Observable<PageResponse<Propiedad>> {
    const filters: PropiedadListFilters = {
      q: '',
      tipo: null,
      estado: null,
      page,
      size: 100,
      sort: 'nombre,asc',
    };

    return this.propiedadApi.list(filters);
  }

  private buildRequest(): UnidadRequest | null {
    const values = this.form.getRawValue();
    const estadoOperativo = this.isEdit()
      ? this.loadedUnit()?.estadoOperativo
      : values.estadoOperativo;

    if (
      values.area === null ||
      values.dormitorios === null ||
      values.banos === null ||
      values.piso === null ||
      values.precioBase === null ||
      estadoOperativo === null ||
      estadoOperativo === undefined
    ) {
      return null;
    }

    return {
      nombre: values.nombre.trim(),
      tipoUnidad: values.tipoUnidad.trim(),
      descripcion: this.optionalText(values.descripcion),
      area: values.area,
      dormitorios: values.dormitorios,
      banos: values.banos,
      piso: values.piso,
      ubicacionInterna: this.optionalText(values.ubicacionInterna),
      precioBase: values.precioBase,
      estadoOperativo,
    };
  }

  private setUnitTypeSelection(value: string): void {
    const normalizedValue = value.trim().toUpperCase();
    const knownOption = UNIT_TYPE_OPTIONS.find(
      (option) => option.value !== 'OTRO' && option.value === normalizedValue,
    );

    this.selectedUnitTypeOption.set(knownOption?.value ?? (normalizedValue ? 'OTRO' : ''));
  }

  private normalizeUnitTypeValue(value: string): string {
    const normalizedValue = value.trim().toUpperCase();
    const knownOption = UNIT_TYPE_OPTIONS.find(
      (option) => option.value !== 'OTRO' && option.value === normalizedValue,
    );

    return knownOption?.value ?? value.trim();
  }

  private isUnitTypeSelection(value: string): value is UnidadTipoSelection {
    return value === '' || UNIT_TYPE_OPTIONS.some((option) => option.value === value);
  }

  private clientFieldMessage(field: UnidadFormField, control: AbstractControl): string | null {
    if (control.hasError('required')) {
      return {
        nombre: 'El nombre es obligatorio.',
        tipoUnidad: 'El tipo de unidad es obligatorio.',
        descripcion: null,
        area: 'El área es obligatoria.',
        dormitorios: 'Los dormitorios son obligatorios.',
        banos: 'Los baños son obligatorios.',
        piso: 'El piso es obligatorio.',
        ubicacionInterna: null,
        precioBase: 'El precio base es obligatorio.',
        estadoOperativo: 'Selecciona un estado operativo.',
      }[field];
    }

    if (control.hasError('maxlength')) {
      return {
        nombre: 'El nombre no puede superar 100 caracteres.',
        tipoUnidad: 'El tipo de unidad no puede superar 50 caracteres.',
        descripcion: 'La descripción no puede superar 500 caracteres.',
        area: null,
        dormitorios: null,
        banos: null,
        piso: null,
        ubicacionInterna: 'La ubicación interna no puede superar 150 caracteres.',
        precioBase: null,
        estadoOperativo: null,
      }[field];
    }

    if (control.hasError('min') || control.hasError('integer')) {
      return {
        nombre: null,
        tipoUnidad: null,
        descripcion: null,
        area: 'El área no puede ser negativa.',
        dormitorios: 'Los dormitorios deben ser enteros no negativos.',
        banos: 'Los baños deben ser enteros no negativos.',
        piso: 'El piso debe ser un entero no negativo.',
        ubicacionInterna: null,
        precioBase: 'El precio base no puede ser negativo.',
        estadoOperativo: 'El estado operativo no es válido.',
      }[field];
    }

    if (control.hasError('operationalStatus')) {
      return 'El estado operativo no es válido.';
    }

    return null;
  }

  private consumeSaveError(requestError: unknown): void {
    const problem =
      requestError instanceof HttpErrorResponse && isProblemDetail(requestError.error)
        ? requestError.error
        : null;
    const isConflict = requestError instanceof HttpErrorResponse && requestError.status === 409;

    this.feedback.set(
      isConflict
        ? 'Ya existe una unidad con ese nombre dentro de la propiedad.'
        : (problem?.detail ??
            (requestError instanceof HttpErrorResponse && requestError.status === 403
              ? 'No tienes permisos para guardar esta unidad.'
              : 'No fue posible guardar la unidad.')),
    );
    this.fieldErrors.set(
      Object.fromEntries((problem?.fieldErrors ?? []).map((field) => [field.field, field.message])),
    );
  }

  private loadErrorMessage(requestError: unknown): string {
    if (requestError instanceof HttpErrorResponse && requestError.status === 404) {
      return 'La unidad solicitada no fue encontrada.';
    }

    if (requestError instanceof HttpErrorResponse && requestError.status === 403) {
      return 'No tienes acceso a esta unidad.';
    }

    return this.errorMessage(requestError, 'No fue posible cargar la unidad.');
  }

  private errorMessage(requestError: unknown, fallback: string): string {
    if (requestError instanceof HttpErrorResponse && isProblemDetail(requestError.error)) {
      return requestError.error.detail?.trim() || fallback;
    }

    return fallback;
  }

  private goToList(codpropFallback: number | null): void {
    const queryContext = this.listContext(codpropFallback);
    const queryParams = serializeUnidadListContext(queryContext);
    const hasContext = Object.keys(queryParams).length > 0;

    void this.router.navigate(['/app/unidades/listar'], hasContext ? { queryParams } : {});
  }

  private listContext(codpropFallback: number | null): UnidadListContext {
    const routeContext = parseUnidadListContext(this.route.snapshot.queryParamMap);

    return {
      ...routeContext,
      codprop: routeContext.codprop ?? codpropFallback,
    };
  }

  private navigateToDestination(commands: readonly unknown[], context: UnidadListContext): void {
    const extras = this.destinationExtras(context);

    if (extras === null) {
      void this.router.navigate(commands);
      return;
    }

    void this.router.navigate(commands, extras);
  }

  private destinationExtras(context: UnidadListContext): NavigationExtras | null {
    const queryParams = serializeUnidadListContext(context);
    const hasContext = Object.keys(queryParams).length > 0;

    return hasContext ? { queryParams } : null;
  }

  private optionalText(value: string): string | null {
    const trimmedValue = value.trim();

    return trimmedValue || null;
  }

  private parseIdentifier(value: string | null): number | null {
    if (value === null) {
      return null;
    }

    const identifier = Number(value);

    return this.isValidIdentifier(identifier) ? identifier : null;
  }

  private isValidIdentifier(value: number): value is number {
    return Number.isSafeInteger(value) && value > 0;
  }

  private operationalStatusValidator(control: AbstractControl): ValidationErrors | null {
    return control.value === 0 || control.value === 1 ? null : { operationalStatus: true };
  }
}
