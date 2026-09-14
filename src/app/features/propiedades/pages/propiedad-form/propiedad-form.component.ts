import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnDestroy, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  Observable,
  Subscription,
  combineLatest,
  distinctUntilChanged,
  finalize,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';

import { isProblemDetail } from '../../../../core/api/problem-detail.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { PropiedadCoverFieldComponent } from '../../components/propiedad-cover-field/propiedad-cover-field.component';
import { PropiedadLocationMapComponent } from '../../components/propiedad-location-map/propiedad-location-map.component';
import { PropiedadApiService } from '../../data/propiedad-api.service';
import { LocationGeocodingService } from '../../data/location-geocoding.service';
import { PropiedadFormValue, PropiedadRequest } from '../../models/propiedad-form.model';
import {
  LocationGeocodingResult,
  PropiedadCoordinates,
} from '../../models/propiedad-location.model';
import { Propiedad, PropiedadTipo } from '../../models/propiedad.model';
import { formatPropiedadInvestment } from '../../utils/propiedad-formatters';

export type PropiedadFormMode = 'create' | 'edit';

type PropiedadFormControls = {
  [Field in keyof PropiedadFormValue]: FormControl<PropiedadFormValue[Field]>;
};

type PropiedadFormField = keyof PropiedadFormValue;
type LocationReverseState = 'idle' | 'updating' | 'error';

const notBlankValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  String(control.value ?? '').trim() ? null : { required: true };

const coordinatePairValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const latitude = control.get('latitud')?.value as number | null;
  const longitude = control.get('longitud')?.value as number | null;

  return (latitude === null) === (longitude === null) ? null : { coordinatesIncomplete: true };
};

@Component({
  selector: 'app-propiedad-form',
  imports: [
    MatIconModule,
    PropiedadCoverFieldComponent,
    PropiedadLocationMapComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './propiedad-form.component.html',
  styleUrl: './propiedad-form.component.css',
})
export class PropiedadFormComponent implements OnDestroy {
  private readonly api = inject(PropiedadApiService);
  private readonly auth = inject(AuthService);
  private readonly locationGeocoding = inject(LocationGeocodingService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notification = inject(OrmanNotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly requestedCodprop = this.route.snapshot.paramMap.get('codprop');
  private readonly codprop = this.parseCodprop(this.requestedCodprop);

  protected readonly mode = signal<PropiedadFormMode>(
    this.requestedCodprop === null ? 'create' : 'edit',
  );
  protected readonly loading = signal(this.mode() === 'edit');
  protected readonly loadingError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly submitAttempted = signal(false);
  protected readonly feedback = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});
  private readonly loadedProperty = signal<Propiedad | null>(null);
  protected readonly form = new FormGroup<PropiedadFormControls>(
    {
      nombre: new FormControl('', {
        nonNullable: true,
        validators: [notBlankValidator, Validators.maxLength(120)],
      }),
      tipo: new FormControl<PropiedadTipo | null>(null, { validators: [Validators.required] }),
      direccion: new FormControl('', {
        nonNullable: true,
        validators: [notBlankValidator, Validators.maxLength(200)],
      }),
      ciudad: new FormControl('', {
        nonNullable: true,
        validators: [notBlankValidator, Validators.maxLength(100)],
      }),
      referencia: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(255)],
      }),
      latitud: new FormControl<number | null>(null, {
        validators: [Validators.min(-90), Validators.max(90)],
      }),
      longitud: new FormControl<number | null>(null, {
        validators: [Validators.min(-180), Validators.max(180)],
      }),
      inversionInicial: new FormControl<number | null>(null, {
        validators: [Validators.required, Validators.min(0)],
      }),
    },
    { validators: coordinatePairValidator },
  );
  private readonly formValues = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  protected readonly mapCoordinates = toSignal(
    combineLatest([
      this.form.controls.latitud.valueChanges.pipe(startWith(this.form.controls.latitud.value)),
      this.form.controls.longitud.valueChanges.pipe(startWith(this.form.controls.longitud.value)),
    ]).pipe(
      map(([latitud, longitud]) => this.toCoordinates(latitud, longitud)),
      distinctUntilChanged(
        (previous, current) =>
          previous?.latitud === current?.latitud && previous?.longitud === current?.longitud,
      ),
    ),
    {
      initialValue: this.toCoordinates(
        this.form.controls.latitud.value,
        this.form.controls.longitud.value,
      ),
    },
  );
  protected readonly locationReverseState = signal<LocationReverseState>('idle');
  protected readonly locationFeedback = signal<string | null>(null);
  protected readonly locationSuggestion = signal<string | null>(null);
  private reverseSubscription: Subscription | null = null;
  protected readonly selectedCoverFile = signal<File | null>(null);
  private readonly localCoverPreviewUrl = signal<string | null>(null);
  private readonly originalCoverUrl = signal<string | null>(null);
  private readonly originalHasCover = signal(false);
  protected readonly coverDeletePending = signal(false);
  protected readonly coverLoading = signal(false);
  protected readonly coverError = signal<string | null>(null);
  protected readonly coverDisplayUrl = computed(() => {
    if (this.coverDeletePending()) {
      return null;
    }

    return this.localCoverPreviewUrl() ?? this.originalCoverUrl();
  });
  protected readonly coverCanRemove = computed(
    () => this.selectedCoverFile() !== null || this.originalHasCover(),
  );
  protected readonly coverChangesPending = computed(
    () => this.selectedCoverFile() !== null || this.coverDeletePending(),
  );
  protected readonly propertyPreview = computed(() => {
    const values = this.formValues();

    return {
      nombre: values.nombre?.trim() || 'Nombre de la propiedad',
      tipo: values.tipo,
      ciudad: values.ciudad?.trim() || 'Ciudad pendiente',
      inversionInicial: values.inversionInicial ?? null,
    };
  });

  constructor() {
    if (this.isEdit()) {
      this.loadProperty();
    }
  }

  protected isEdit(): boolean {
    return this.mode() === 'edit';
  }

  protected title(): string {
    return this.isEdit() ? 'Editar propiedad' : 'Nueva propiedad';
  }

  protected description(): string {
    return this.isEdit()
      ? 'Actualiza la información del inmueble.'
      : 'Completa los datos del inmueble.';
  }

  protected propertyTypeLabel(tipo: PropiedadTipo | null | undefined): string {
    if (tipo === 'EDIFICIO') {
      return 'Edificio';
    }

    if (tipo === 'CASA') {
      return 'Casa';
    }

    return 'Tipo pendiente';
  }

  protected formatPreviewInvestment(value: number | null | undefined): string {
    return value === null || value === undefined
      ? 'Inversión pendiente'
      : formatPropiedadInvestment(value);
  }

  protected handleMapCoordinates(coordinates: PropiedadCoordinates): void {
    this.cancelReverseRequest();
    this.updateCoordinates(coordinates);
    this.locationSuggestion.set(null);
    this.reverseGeocode(coordinates);
  }

  protected fieldMessage(field: PropiedadFormField): string | null {
    const control = this.form.controls[field];

    if (control.invalid && (control.touched || this.submitAttempted())) {
      return this.clientFieldMessage(field, control);
    }

    return this.fieldErrors()[field] ?? null;
  }

  protected coordinatesMessage(): string | null {
    if (
      this.form.hasError('coordinatesIncomplete') &&
      (this.submitAttempted() ||
        this.form.controls.latitud.touched ||
        this.form.controls.longitud.touched)
    ) {
      return 'Ingresa latitud y longitud juntas o deja ambas vacías.';
    }

    return null;
  }

  protected cancel(): void {
    if (!this.submitting()) {
      this.goToList();
    }
  }

  protected handleCoverSelection(file: File): void {
    this.coverError.set(null);
    this.coverDeletePending.set(false);
    this.releaseLocalCoverPreview();
    this.selectedCoverFile.set(file);
    this.localCoverPreviewUrl.set(URL.createObjectURL(file));
  }

  protected handleCoverValidationError(message: string): void {
    this.coverError.set(message);
  }

  protected removeCover(): void {
    this.coverError.set(null);

    if (this.selectedCoverFile()) {
      this.releaseLocalCoverPreview();
      this.selectedCoverFile.set(null);
      return;
    }

    if (this.originalHasCover()) {
      this.coverDeletePending.update((pending) => !pending);
    }
  }

  private reverseGeocode(coordinates: PropiedadCoordinates): void {
    this.reverseSubscription?.unsubscribe();
    this.locationReverseState.set('updating');
    this.locationFeedback.set('Obteniendo una dirección aproximada…');
    this.reverseSubscription = this.locationGeocoding
      .reverse(coordinates)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (!result) {
            this.locationReverseState.set('idle');
            this.locationFeedback.set(
              'Coordenadas actualizadas. No encontramos una dirección aproximada.',
            );
            return;
          }

          this.locationSuggestion.set(result.displayName);
          this.fillEmptyLocationFields(result);
          this.locationReverseState.set('idle');
          this.locationFeedback.set(
            'Coordenadas actualizadas. La dirección aproximada solo completa campos vacíos.',
          );
        },
        error: () => {
          this.locationReverseState.set('error');
          this.locationFeedback.set(
            'Coordenadas actualizadas, pero no se pudo obtener una dirección aproximada.',
          );
        },
      });
  }

  private fillEmptyLocationFields(result: LocationGeocodingResult): void {
    const addressControl = this.form.controls.direccion;
    const cityControl = this.form.controls.ciudad;

    if (!addressControl.value.trim() && result.direccion) {
      addressControl.setValue(result.direccion);
      addressControl.markAsDirty();
    }

    if (!cityControl.value.trim() && result.ciudad) {
      cityControl.setValue(result.ciudad);
      cityControl.markAsDirty();
    }
  }

  private updateCoordinates(coordinates: PropiedadCoordinates): void {
    this.form.controls.latitud.setValue(coordinates.latitud);
    this.form.controls.longitud.setValue(coordinates.longitud);
    this.form.controls.latitud.markAsDirty();
    this.form.controls.longitud.markAsDirty();
  }

  private cancelReverseRequest(): void {
    this.reverseSubscription?.unsubscribe();
    this.reverseSubscription = null;
  }

  private toCoordinates(
    latitud: number | null,
    longitud: number | null,
  ): PropiedadCoordinates | null {
    if (
      latitud === null ||
      longitud === null ||
      !Number.isFinite(latitud) ||
      !Number.isFinite(longitud) ||
      latitud < -90 ||
      latitud > 90 ||
      longitud < -180 ||
      longitud > 180
    ) {
      return null;
    }

    return { latitud, longitud };
  }

  protected submit(): void {
    this.submitAttempted.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting()) {
      return;
    }

    const request = this.buildRequest();

    if (!request) {
      return;
    }

    this.submitting.set(true);
    this.feedback.set(null);
    this.fieldErrors.set({});

    const creating = !this.isEdit();
    const request$ = this.isEdit()
      ? this.api.update(this.codprop!, request)
      : this.api.create(request);
    let persistedProperty: Propiedad | null = null;

    request$
      .pipe(
        switchMap((property) => {
          persistedProperty = property;
          return this.persistCoverChange(property.codprop);
        }),
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.notification.success(
            creating ? 'Propiedad creada correctamente.' : 'Propiedad actualizada correctamente.',
          );
          this.goToList();
        },
        error: (requestError: unknown) => {
          if (persistedProperty) {
            this.handlePartialCoverSave(creating);
            return;
          }

          this.consumeSaveError(requestError);
        },
      });
  }

  private loadProperty(): void {
    if (this.codprop === null) {
      this.loading.set(false);
      this.loadingError.set('El código de la propiedad no es válido.');
      return;
    }

    this.api
      .get(this.codprop)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (propiedad) => {
          this.loadedProperty.set(propiedad);
          this.clearCoverState();
          this.form.reset({
            nombre: propiedad.nombre,
            tipo: propiedad.tipo,
            direccion: propiedad.direccion,
            ciudad: propiedad.ciudad,
            referencia: propiedad.referencia ?? '',
            latitud: propiedad.latitud,
            longitud: propiedad.longitud,
            inversionInicial: propiedad.inversionInicial,
          });
          this.form.markAsPristine();
          this.form.markAsUntouched();

          this.originalHasCover.set(propiedad.tienePortada);
          if (propiedad.tienePortada) {
            this.loadCover(this.codprop!);
          }
        },
        error: (requestError: unknown) => {
          this.loadingError.set(this.loadErrorMessage(requestError));
        },
      });
  }

  private loadCover(codprop: number): void {
    this.coverLoading.set(true);
    this.api
      .getPortada(codprop)
      .pipe(
        finalize(() => this.coverLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (blob) => {
          this.releaseOriginalCoverUrl();
          this.originalCoverUrl.set(URL.createObjectURL(blob));
          this.coverError.set(null);
        },
        error: (requestError: unknown) => {
          this.coverError.set(this.coverLoadErrorMessage(requestError));
        },
      });
  }

  private persistCoverChange(codprop: number): Observable<void> {
    const selectedFile = this.selectedCoverFile();

    if (selectedFile) {
      return this.api.uploadPortada(codprop, selectedFile);
    }

    if (this.coverDeletePending() && this.originalHasCover()) {
      return this.api.deletePortada(codprop);
    }

    return of(void 0);
  }

  private handlePartialCoverSave(creating: boolean): void {
    const coverAction = this.coverDeletePending() ? 'eliminar' : 'guardar';
    const propertyAction = creating ? 'creó' : 'actualizó';

    this.notification.warning(
      `La propiedad se ${propertyAction} correctamente, pero no se pudo ${coverAction} la portada. Puedes intentarlo nuevamente desde Editar propiedad.`,
    );
    this.goToList();
  }

  private buildRequest(): PropiedadRequest | null {
    const values = this.form.getRawValue();
    const currentProperty = this.loadedProperty();
    const codperPropietaria = currentProperty?.codperPropietaria ?? this.auth.codper();

    if (!this.isValidIdentifier(codperPropietaria)) {
      this.feedback.set('No fue posible identificar al propietario para registrar la propiedad.');
      return null;
    }

    if (values.tipo === null || values.inversionInicial === null) {
      return null;
    }

    return {
      nombre: values.nombre.trim(),
      tipo: values.tipo,
      direccion: values.direccion.trim(),
      ciudad: values.ciudad.trim(),
      referencia: this.optionalText(values.referencia),
      latitud: values.latitud,
      longitud: values.longitud,
      portadaUrl: currentProperty?.portadaUrl ?? null,
      codperPropietaria,
      inversionInicial: values.inversionInicial,
      estado: currentProperty?.estado ?? 1,
    };
  }

  private clientFieldMessage(field: PropiedadFormField, control: AbstractControl): string | null {
    if (control.hasError('required')) {
      return {
        nombre: 'El nombre es obligatorio.',
        tipo: 'Selecciona un tipo de propiedad.',
        direccion: 'La dirección es obligatoria.',
        ciudad: 'La ciudad es obligatoria.',
        referencia: null,
        latitud: null,
        longitud: null,
        inversionInicial: 'La inversión inicial es obligatoria.',
      }[field];
    }

    if (control.hasError('maxlength')) {
      return {
        nombre: 'El nombre no puede superar 120 caracteres.',
        tipo: null,
        direccion: 'La dirección no puede superar 200 caracteres.',
        ciudad: 'La ciudad no puede superar 100 caracteres.',
        referencia: 'La referencia no puede superar 255 caracteres.',
        latitud: null,
        longitud: null,
        inversionInicial: null,
      }[field];
    }

    if (control.hasError('min') || control.hasError('max')) {
      return {
        nombre: null,
        tipo: null,
        direccion: null,
        ciudad: null,
        referencia: null,
        latitud: 'La latitud debe estar entre -90 y 90.',
        longitud: 'La longitud debe estar entre -180 y 180.',
        inversionInicial: 'La inversión inicial no puede ser negativa.',
      }[field];
    }

    return null;
  }

  private consumeSaveError(requestError: unknown): void {
    const problem =
      requestError instanceof HttpErrorResponse && isProblemDetail(requestError.error)
        ? requestError.error
        : null;

    this.feedback.set(
      problem?.detail ??
        (requestError instanceof HttpErrorResponse && requestError.status === 403
          ? 'No tienes permisos para guardar esta propiedad.'
          : 'No fue posible guardar la propiedad.'),
    );
    this.fieldErrors.set(
      Object.fromEntries((problem?.fieldErrors ?? []).map((field) => [field.field, field.message])),
    );
  }

  private loadErrorMessage(requestError: unknown): string {
    const problem =
      requestError instanceof HttpErrorResponse && isProblemDetail(requestError.error)
        ? requestError.error
        : null;

    if (problem?.detail) {
      return problem.detail;
    }

    if (requestError instanceof HttpErrorResponse && requestError.status === 404) {
      return 'La propiedad solicitada no fue encontrada.';
    }

    if (requestError instanceof HttpErrorResponse && requestError.status === 403) {
      return 'No tienes acceso a esta propiedad.';
    }

    return 'No fue posible cargar la propiedad.';
  }

  private coverLoadErrorMessage(requestError: unknown): string {
    const problem =
      requestError instanceof HttpErrorResponse && isProblemDetail(requestError.error)
        ? requestError.error
        : null;

    if (problem?.detail) {
      return problem.detail;
    }

    if (requestError instanceof HttpErrorResponse && requestError.status === 404) {
      return 'La portada no fue encontrada.';
    }

    if (requestError instanceof HttpErrorResponse && requestError.status === 403) {
      return 'No tienes acceso a la portada de esta propiedad.';
    }

    return 'No fue posible cargar la portada.';
  }

  private goToList(): void {
    this.clearCoverState();
    void this.router.navigate(['/app/propiedades/listar']);
  }

  ngOnDestroy(): void {
    this.cancelReverseRequest();
    this.releaseCoverUrls();
  }

  private releaseCoverUrls(): void {
    this.releaseLocalCoverPreview();
    this.releaseOriginalCoverUrl();
  }

  private releaseLocalCoverPreview(): void {
    const url = this.localCoverPreviewUrl();

    if (url) {
      URL.revokeObjectURL(url);
    }

    this.localCoverPreviewUrl.set(null);
  }

  private releaseOriginalCoverUrl(): void {
    const url = this.originalCoverUrl();

    if (url) {
      URL.revokeObjectURL(url);
    }

    this.originalCoverUrl.set(null);
  }

  private clearCoverState(): void {
    this.releaseCoverUrls();
    this.selectedCoverFile.set(null);
    this.originalHasCover.set(false);
    this.coverDeletePending.set(false);
    this.coverError.set(null);
  }

  private optionalText(value: string): string | null {
    const trimmedValue = value.trim();

    return trimmedValue || null;
  }

  private parseCodprop(value: string | null): number | null {
    if (value === null) {
      return null;
    }

    const codprop = Number(value);

    return this.isValidIdentifier(codprop) ? codprop : null;
  }

  private isValidIdentifier(value: number | null): value is number {
    return value !== null && Number.isSafeInteger(value) && value > 0;
  }
}
