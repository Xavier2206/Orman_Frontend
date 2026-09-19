import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { finalize, map, startWith } from 'rxjs';

import { isProblemDetail } from '../../../../core/api/problem-detail.model';
import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { Persona } from '../../../personas/models/persona.model';
import { Propiedad } from '../../../propiedades/models/propiedad.model';
import { UnidadResponse } from '../../../unidades/models/unidad.model';
import {
  ContratoLocationPickerComponent,
  ContratoLocationSelection,
} from '../../components/contrato-location-picker/contrato-location-picker.component';
import { ContratoCreatePreviewComponent } from '../../components/contrato-create-preview/contrato-create-preview.component';
import { ContratoArchivoManagerComponent } from '../../components/contrato-archivo-manager/contrato-archivo-manager.component';
import { ContratoTenantPickerComponent } from '../../components/contrato-tenant-picker/contrato-tenant-picker.component';
import { ContratoApiService } from '../../data/contrato-api.service';
import {
  Contrato,
  ContratoArchivoResponse,
  ContratoCreateRequest,
} from '../../models/contrato.model';
import { buildContratoPeriodPreview } from '../../utils/contrato-period';

type ContractCreateFormControls = {
  fechaInicioMes: FormControl<string>;
  duracionMeses: FormControl<number>;
  montoMensual: FormControl<number | null>;
  garantia: FormControl<number | null>;
};

@Component({
  selector: 'app-contrato-create',
  imports: [
    ContratoLocationPickerComponent,
    ContratoCreatePreviewComponent,
    ContratoArchivoManagerComponent,
    ContratoTenantPickerComponent,
    MatIconModule,
    ReactiveFormsModule,
  ],
  templateUrl: './contrato-create.component.html',
  styleUrl: './contrato-create.component.css',
})
export class ContratoCreateComponent {
  private readonly contratoApi = inject(ContratoApiService);
  private readonly notification = inject(OrmanNotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = new FormGroup<ContractCreateFormControls>({
    fechaInicioMes: new FormControl(this.currentMonth(), {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[0-9]{4}-(0[1-9]|1[0-2])$/)],
    }),
    duracionMeses: new FormControl(12, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    montoMensual: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    garantia: new FormControl<number | null>(0, [Validators.required, Validators.min(0)]),
  });

  private readonly formValues = toSignal(
    this.form.valueChanges.pipe(
      map(() => this.form.getRawValue()),
      startWith(this.form.getRawValue()),
    ),
    { initialValue: this.form.getRawValue() },
  );

  protected readonly selectedProperty = signal<Propiedad | null>(null);
  protected readonly selectedUnit = signal<UnidadResponse | null>(null);
  protected readonly selectedTenant = signal<Persona | null>(null);
  protected readonly submitting = signal(false);
  protected readonly submitAttempted = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly createdContract = signal<Contrato | null>(null);
  protected readonly selectedDocument = signal<File | null>(null);
  protected readonly documentSelectionInvalid = signal(false);
  protected readonly uploadedDocument = signal<ContratoArchivoResponse | null>(null);
  protected readonly periodPreview = computed(() =>
    buildContratoPeriodPreview(this.formValues().fechaInicioMes, this.formValues().duracionMeses),
  );
  protected readonly durationOptions = [
    { value: 1, label: '1 mes' },
    { value: 6, label: '6 meses' },
    { value: 12, label: '12 meses' },
    { value: 24, label: '24 meses' },
  ] as const;

  protected updateLocation(selection: ContratoLocationSelection): void {
    this.selectedProperty.set(selection.propiedad);
    this.selectedUnit.set(selection.unidad);
  }

  protected updateTenant(tenant: Persona | null): void {
    this.selectedTenant.set(tenant);
  }

  protected updateDocumentSelection(file: File | null): void {
    this.selectedDocument.set(file);
  }

  protected updateDocumentSelectionValidity(invalid: boolean): void {
    this.documentSelectionInvalid.set(invalid);
  }

  protected documentUploaded(file: ContratoArchivoResponse): void {
    this.uploadedDocument.set(file);
    this.notification.success('Documento del contrato cargado correctamente.');
  }

  protected createContract(): void {
    if (this.createdContract() || this.submitting()) {
      return;
    }

    this.submitAttempted.set(true);
    this.form.markAllAsTouched();
    this.submitError.set(null);

    const selectedUnit = this.selectedUnit();
    const selectedTenant = this.selectedTenant();
    const period = this.periodPreview();

    if (this.documentSelectionInvalid()) {
      this.submitError.set('Corrige o quita el archivo PDF seleccionado antes de continuar.');
      return;
    }

    if (this.form.invalid || !selectedUnit || !selectedTenant || !period) {
      return;
    }

    const values = this.form.getRawValue();

    if (values.montoMensual === null || values.garantia === null) {
      return;
    }

    const request: ContratoCreateRequest = {
      codperInquilino: selectedTenant.codper,
      fechaInicio: period.fechaInicio,
      fechaFin: period.fechaFin,
      montoMensual: values.montoMensual,
      garantia: values.garantia,
    };

    this.submitting.set(true);
    this.contratoApi
      .create(selectedUnit.coduni, request)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (createdContract) => {
          this.createdContract.set(createdContract);
          this.notification.success('Contrato creado correctamente.');

          if (this.selectedDocument()) {
            return;
          }

          void this.router.navigateByUrl('/app/contratos/listar');
        },
        error: (requestError: unknown) => {
          this.submitError.set(this.createErrorMessage(requestError));
        },
      });
  }

  protected cancel(): void {
    void this.router.navigateByUrl('/app/contratos/listar');
  }

  protected viewCreatedContract(codcon: number): void {
    void this.router.navigateByUrl(`/app/contratos/${codcon}/detalle`);
  }

  protected fieldInvalid(field: keyof ContractCreateFormControls): boolean {
    const control = this.form.controls[field];

    return control.invalid && (control.touched || this.submitAttempted());
  }

  private createErrorMessage(requestError: unknown): string {
    if (requestError instanceof HttpErrorResponse) {
      switch (requestError.status) {
        case 400:
          return 'Datos inválidos. Revisa la información ingresada.';
        case 403:
          return 'No tienes permisos para crear contratos.';
        case 404:
          return 'No se encontró la unidad o la persona seleccionada.';
        case 409:
          return 'Ya existe un contrato que se superpone con este período.';
        case 422:
          return this.problemDetail(requestError) ?? 'La solicitud no cumple una regla de negocio.';
      }
    }

    return (
      this.problemDetail(requestError) ?? 'No fue posible crear el contrato. Inténtalo nuevamente.'
    );
  }

  private problemDetail(requestError: unknown): string | null {
    if (
      requestError instanceof HttpErrorResponse &&
      isProblemDetail(requestError.error) &&
      requestError.error.detail
    ) {
      return requestError.error.detail;
    }

    return null;
  }

  private currentMonth(): string {
    const today = new Date();
    const month = `${today.getMonth() + 1}`.padStart(2, '0');

    return `${today.getFullYear()}-${month}`;
  }
}
