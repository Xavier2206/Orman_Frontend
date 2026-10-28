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
import { PagoCreateRequest } from '../../../contratos/models/contrato.model';
import { PersonaModalFocusDirective } from '../../../personas/components/persona-modal-focus.directive';
import { CuotaListado } from '../../models/cuota-listado.model';

type RegistrarPagoForm = FormGroup<{
  monto: FormControl<string>;
}>;

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
  protected readonly form: RegistrarPagoForm = new FormGroup({
    monto: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, this.validateAmount()],
    }),
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

  protected showAmountError(errorName: string): boolean {
    const amountControl = this.form.controls.monto;
    return (amountControl.touched || amountControl.dirty) && amountControl.hasError(errorName);
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

    if (this.form.invalid) {
      return;
    }

    const request: PagoCreateRequest = {
      monto: Number(this.form.controls.monto.value.trim().replace(',', '.')),
      metodo: 'EFECTIVO',
      idempotencyKey: this.idempotencyKey,
    };

    this.feedback.set(null);
    this.form.disable({ emitEvent: false });
    this.submitting.set(true);
    this.pagoApi
      .create(this.cuota().codcuo, request)
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
