import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';

import { isProblemDetail } from '../../../../core/api/problem-detail.model';
import { PagoApiService } from '../../../contratos/data/pago-api.service';
import { MetodoPago, PagoCreateRequest } from '../../../contratos/models/contrato.model';
import { PersonaModalFocusDirective } from '../../../personas/components/persona-modal-focus.directive';
import { CuotaListado } from '../../models/cuota-listado.model';

type RegistrarPagoForm = FormGroup<{
  monto: FormControl<string>;
  metodo: FormControl<MetodoPago>;
  fecha: FormControl<string>;
  hora: FormControl<string>;
}>;

interface BusinessTime {
  readonly date: string;
  readonly time: string;
}

const BUSINESS_TIME_ZONE = 'America/La_Paz';
const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_RECEIPT_TYPES = ['image/png', 'image/jpeg'];

@Component({
  selector: 'app-registrar-pago-modal',
  imports: [MatIconModule, ReactiveFormsModule, PersonaModalFocusDirective],
  templateUrl: './registrar-pago-modal.component.html',
  styleUrl: './registrar-pago-modal.component.css',
})
export class RegistrarPagoModalComponent {
  readonly cuota = input.required<CuotaListado>();
  readonly closed = output<void>();
  readonly registered = output<void>();

  private readonly pagoApi = inject(PagoApiService);
  private readonly destroyRef = inject(DestroyRef);
  private idempotencyKey: string | null = globalThis.crypto.randomUUID();

  protected readonly submitting = signal(false);
  protected readonly feedback = signal<string | null>(null);
  protected readonly comprobante = signal<File | null>(null);
  protected readonly comprobanteError = signal<string | null>(null);
  private readonly selectedMethod = signal<MetodoPago>('EFECTIVO');
  protected readonly isQr = computed(() => this.selectedMethod() === 'QR');
  protected readonly businessDate = this.getBusinessTime().date;
  protected readonly businessTime = this.getBusinessTime().time;
  protected readonly form: RegistrarPagoForm = new FormGroup({
    monto: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, this.validateAmount()],
    }),
    metodo: new FormControl<MetodoPago>('EFECTIVO', { nonNullable: true }),
    fecha: new FormControl('', { nonNullable: true }),
    hora: new FormControl('', { nonNullable: true }),
  });
  private readonly amountValue = toSignal(this.form.controls.monto.valueChanges, {
    initialValue: this.form.controls.monto.value,
  });
  protected readonly balanceAfterPayment = computed(() => {
    const amountCents = this.parseAmountCents(this.amountValue());
    const availableBalanceCents = this.toMoneyCents(this.cuota().saldo);

    if (amountCents === null || amountCents < 1 || amountCents > availableBalanceCents) {
      return null;
    }

    return this.formatMoney((availableBalanceCents - amountCents) / 100);
  });

  constructor() {
    this.form.addValidators(this.validatePaymentDateTime());
    this.updateMethodValidators('EFECTIVO');
    this.form.controls.metodo.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((method) => {
        this.updateMethodValidators(method);
        this.feedback.set(null);

        if (method === 'EFECTIVO') {
          this.clearQrFields();
        }
      });
  }

  protected formatMoney(amount: number): string {
    return (
      'Bs ' +
      amount.toLocaleString('es-BO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  protected formatPeriod(period: string): string {
    const match = /^(\d{4})-(\d{2})/.exec(period);

    if (!match) {
      return period;
    }

    const monthDate = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
    const formatted = new Intl.DateTimeFormat('es-BO', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })
      .format(monthDate)
      .replace(/\s+de\s+/, ' ');

    return formatted.charAt(0).toLocaleUpperCase('es-BO') + formatted.slice(1);
  }

  protected maxTimeForDate(): string | null {
    return this.form.controls.fecha.value === this.businessDate ? this.businessTime : null;
  }

  protected showAmountError(errorName: string): boolean {
    const amountControl = this.form.controls.monto;
    return (amountControl.touched || amountControl.dirty) && amountControl.hasError(errorName);
  }

  protected selectComprobante(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.comprobanteError.set(null);

    if (!file) {
      this.comprobante.set(null);
      return;
    }

    if (!this.isAllowedReceipt(file)) {
      this.rejectComprobante(input, 'Selecciona una imagen PNG o JPEG.');
      return;
    }

    if (file.size > MAX_RECEIPT_SIZE_BYTES) {
      this.rejectComprobante(input, 'El comprobante debe pesar como máximo 5 MB.');
      return;
    }

    this.comprobante.set(file);
  }

  protected removeComprobante(input: HTMLInputElement): void {
    input.value = '';
    this.comprobante.set(null);
    this.comprobanteError.set(null);
  }

  protected formatFileSize(bytes: number): string {
    if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toLocaleString('es-BO', { maximumFractionDigits: 1 }) + ' MB';
    }

    return (bytes / 1024).toLocaleString('es-BO', { maximumFractionDigits: 1 }) + ' KB';
  }

  protected close(): void {
    if (this.submitting()) {
      return;
    }

    this.idempotencyKey = null;
    this.closed.emit();
  }

  protected submit(): void {
    if (this.submitting() || !this.idempotencyKey) {
      return;
    }

    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.invalid || this.comprobanteError()) {
      return;
    }

    const request: PagoCreateRequest = {
      ...this.createRequestFields(),
      idempotencyKey: this.idempotencyKey,
    };

    this.feedback.set(null);
    this.form.disable({ emitEvent: false });
    this.submitting.set(true);
    this.pagoApi
      .create(this.cuota().codcuo, request, this.comprobante() ?? undefined)
      .pipe(
        finalize(() => {
          this.form.enable({ emitEvent: false });
          this.submitting.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.idempotencyKey = null;
          this.registered.emit();
        },
        error: (requestError: unknown) => {
          this.feedback.set(this.errorMessage(requestError));
        },
      });
  }

  private updateMethodValidators(method: MetodoPago): void {
    this.selectedMethod.set(method);
    const requiredValidators = method === 'QR' ? [Validators.required] : [];

    this.form.controls.fecha.setValidators(requiredValidators);
    this.form.controls.hora.setValidators(requiredValidators);
    this.form.controls.fecha.updateValueAndValidity({ emitEvent: false });
    this.form.controls.hora.updateValueAndValidity({ emitEvent: false });
    this.form.updateValueAndValidity({ emitEvent: false });
  }

  private clearQrFields(): void {
    this.form.controls.fecha.setValue('', { emitEvent: false });
    this.form.controls.hora.setValue('', { emitEvent: false });
    this.form.controls.fecha.markAsPristine();
    this.form.controls.fecha.markAsUntouched();
    this.form.controls.hora.markAsPristine();
    this.form.controls.hora.markAsUntouched();
    this.comprobante.set(null);
    this.comprobanteError.set(null);
  }

  private rejectComprobante(input: HTMLInputElement, message: string): void {
    input.value = '';
    this.comprobante.set(null);
    this.comprobanteError.set(message);
  }

  private isAllowedReceipt(file: File): boolean {
    const filename = file.name.toLocaleLowerCase('en-US');
    const allowedExtensions =
      file.type === 'image/png' ? ['.png'] : file.type === 'image/jpeg' ? ['.jpg', '.jpeg'] : [];

    return (
      ALLOWED_RECEIPT_TYPES.includes(file.type) &&
      allowedExtensions.some((extension) => filename.endsWith(extension))
    );
  }

  private createRequestFields(): Omit<PagoCreateRequest, 'idempotencyKey'> {
    const monto = Number(this.form.controls.monto.value.trim().replace(',', '.'));
    const metodo = this.form.controls.metodo.value;

    if (metodo === 'EFECTIVO') {
      return { monto, metodo };
    }

    return {
      monto,
      metodo,
      fechaPago: this.form.controls.fecha.value + 'T' + this.form.controls.hora.value + ':00',
    };
  }

  private validateAmount(): ValidatorFn {
    return (control): ValidationErrors | null => {
      const rawAmount = String(control.value ?? '').trim();

      if (!rawAmount) {
        return null;
      }

      const amountCents = this.parseAmountCents(rawAmount);

      if (amountCents === null) {
        return { maxDecimals: true };
      }

      if (amountCents < 1) {
        return { minimumAmount: true };
      }

      return amountCents > this.toMoneyCents(this.cuota().saldo) ? { exceedsBalance: true } : null;
    };
  }

  private parseAmountCents(rawAmount: string): number | null {
    const normalizedAmount = rawAmount.trim().replace(',', '.');

    if (!/^-?\d+(\.\d{1,2})?$/.test(normalizedAmount)) {
      return null;
    }

    const isNegative = normalizedAmount.startsWith('-');
    const unsignedAmount = isNegative ? normalizedAmount.slice(1) : normalizedAmount;
    const [wholePart, fractionPart = ''] = unsignedAmount.split('.');
    const amountCents = Number(wholePart) * 100 + Number(fractionPart.padEnd(2, '0'));

    if (!Number.isSafeInteger(amountCents)) {
      return null;
    }

    return isNegative ? -amountCents : amountCents;
  }

  private toMoneyCents(amount: number): number {
    return Math.round(amount * 100);
  }

  private validatePaymentDateTime(): ValidatorFn {
    return (): ValidationErrors | null => {
      if (this.form.controls.metodo.value !== 'QR') {
        return null;
      }

      const date = this.form.controls.fecha.value;
      const time = this.form.controls.hora.value;

      if (!date || !time) {
        return null;
      }

      const current = this.getBusinessTime();
      const selectedDateTime = date + 'T' + time;
      const currentDateTime = current.date + 'T' + current.time;

      return selectedDateTime > currentDateTime ? { futureDateTime: true } : null;
    };
  }

  private getBusinessTime(): BusinessTime {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: BUSINESS_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const partValue = (partType: Intl.DateTimeFormatPartTypes): string =>
      parts.find((part) => part.type === partType)?.value ?? '';

    return {
      date: partValue('year') + '-' + partValue('month') + '-' + partValue('day'),
      time: partValue('hour') + ':' + partValue('minute'),
    };
  }

  private errorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible registrar el pago.';
    }

    if (error.status === 403) {
      return 'No tienes permiso para registrar pagos.';
    }

    if (error.status === 413) {
      return 'Las imágenes deben pesar como máximo 5 MB.';
    }

    if (error.status === 415) {
      return 'Formato de imagen no permitido.';
    }

    if (
      [400, 404, 409, 422].includes(error.status) &&
      isProblemDetail(error.error) &&
      typeof error.error.detail === 'string' &&
      error.error.detail.trim() &&
      this.isSafeProblemDetail(error.error.detail)
    ) {
      return error.error.detail;
    }

    switch (error.status) {
      case 400:
        return 'Revisa los datos ingresados para el pago.';
      case 404:
        return 'La cuota ya no está disponible.';
      case 409:
        return 'No se pudo completar el registro del pago. Actualiza la cuota e inténtalo nuevamente.';
      case 422:
        return 'El monto o la fecha del pago no son válidos para esta cuota.';
      default:
        return 'No fue posible registrar el pago.';
    }
  }

  private isSafeProblemDetail(detail: string): boolean {
    return !/(https?:\/\/|jdbc:|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|stack\s*trace|\bexception\b)/i.test(
      detail,
    );
  }
}
