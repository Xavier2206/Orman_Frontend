import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';

import { isProblemDetail } from '../../../../core/api/problem-detail.model';
import { PersonaModalFocusDirective } from '../../../personas/components/persona-modal-focus.directive';
import { PagoApiService } from '../../../contratos/data/pago-api.service';
import type { MetodoPago, PagoResponse } from '../../../contratos/models/contrato.model';

const METHOD_LABELS: Record<MetodoPago, string> = {
  EFECTIVO: 'Efectivo',
  QR: 'QR',
};

const MAX_REASON_LENGTH = 500;

@Component({
  selector: 'app-anular-pago-modal',
  imports: [MatIconModule, PersonaModalFocusDirective],
  templateUrl: './anular-pago-modal.component.html',
  styleUrl: './anular-pago-modal.component.css',
})
export class AnularPagoModalComponent {
  readonly payment = input.required<PagoResponse>();
  readonly closed = output<boolean>();
  readonly annulled = output<PagoResponse>();

  private readonly paymentApi = inject(PagoApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly reason = signal('');
  protected readonly submitting = signal(false);
  protected readonly feedback = signal<string | null>(null);
  protected readonly reasonInvalid = signal(false);
  private readonly refreshHistoryOnClose = signal(false);

  protected canSubmit(): boolean {
    const reason = this.reason();

    return !this.submitting() && reason.trim().length > 0 && reason.length <= MAX_REASON_LENGTH;
  }

  protected updateReason(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.reason.set(textarea.value);
    this.feedback.set(null);
    this.reasonInvalid.set(false);
  }

  protected formatMoney(amount: number): string {
    return `Bs ${amount.toLocaleString('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  protected methodLabel(method: MetodoPago): string {
    return METHOD_LABELS[method];
  }

  protected formatDateTime(value: string): string {
    const [date, time] = value.split('T');
    const [year, month, day] = date.split('-');

    if (!year || !month || !day) {
      return value;
    }

    return `${day}/${month}/${year}${time ? ` ${time.slice(0, 5)}` : ''}`;
  }

  protected reasonLength(): number {
    return this.reason().length;
  }

  protected close(): void {
    if (this.submitting()) {
      return;
    }

    this.closed.emit(this.refreshHistoryOnClose());
  }

  protected submit(): void {
    if (!this.canSubmit()) {
      return;
    }

    this.feedback.set(null);
    this.reasonInvalid.set(false);
    this.submitting.set(true);

    this.paymentApi
      .annul(this.payment().codpag, this.reason().trim())
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (payment) => this.annulled.emit(payment),
        error: (error: unknown) => this.feedback.set(this.errorMessage(error)),
      });
  }

  private errorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudo anular el pago.';
    }

    const problem = isProblemDetail(error.error) ? error.error : null;

    switch (error.status) {
      case 400:
        this.reasonInvalid.set(true);
        return (
          problem?.fieldErrors?.find((fieldError) => fieldError.field === 'motivo')?.message ??
          problem?.detail ??
          'Revisa el motivo de anulación.'
        );
      case 403:
        return 'No tiene permisos para anular este pago.';
      case 404:
        this.refreshHistoryOnClose.set(true);
        return 'El pago ya no está disponible.';
      case 409:
      case 422:
        this.refreshHistoryOnClose.set(true);
        return problem?.detail ?? 'No se pudo anular el pago.';
      default:
        return 'No se pudo anular el pago.';
    }
  }
}
