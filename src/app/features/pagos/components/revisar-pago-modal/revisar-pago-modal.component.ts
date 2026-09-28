import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  OnChanges,
  SimpleChanges,
  ViewChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { EMPTY, Subject, catchError, finalize, switchMap } from 'rxjs';

import { isProblemDetail } from '../../../../core/api/problem-detail.model';
import { PersonaModalFocusDirective } from '../../../personas/components/persona-modal-focus.directive';
import { PagoApiService } from '../../../contratos/data/pago-api.service';
import type { MetodoPago, PagoResponse } from '../../../contratos/models/contrato.model';
import { ComprobantePagoReviewComponent } from '../comprobante-pago-review/comprobante-pago-review.component';
import type { CuotaListado } from '../../models/cuota-listado.model';

const MAX_REJECTION_REASON_LENGTH = 500;

@Component({
  selector: 'app-revisar-pago-modal',
  imports: [ComprobantePagoReviewComponent, MatIconModule, PersonaModalFocusDirective],
  templateUrl: './revisar-pago-modal.component.html',
  styleUrl: './revisar-pago-modal.component.css',
})
export class RevisarPagoModalComponent implements OnChanges {
  readonly cuota = input.required<CuotaListado>();
  readonly codpag = input.required<number>();
  readonly closed = output<void>();
  readonly reviewed = output<PagoResponse>();
  readonly refreshRequested = output<void>();

  private readonly paymentApi = inject(PagoApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly paymentRequests$ = new Subject<number>();

  @ViewChild(ComprobantePagoReviewComponent)
  private receiptViewer?: ComprobantePagoReviewComponent;

  protected readonly payment = signal<PagoResponse | null>(null);
  protected readonly receiptLoaded = signal(false);
  protected readonly paymentLoading = signal(false);
  protected readonly paymentError = signal<string | null>(null);
  protected readonly operationError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly rejectionReason = signal('');
  protected readonly confirmationPrompt = signal(false);
  protected readonly rejectionForm = signal(false);
  protected readonly reviewUnavailable = signal(false);

  constructor() {
    this.paymentRequests$
      .pipe(
        switchMap((codpag) => {
          this.paymentLoading.set(true);
          this.paymentError.set(null);

          return this.paymentApi.getById(codpag).pipe(
            catchError((error: unknown) => {
              this.paymentError.set(this.paymentLoadError(error));
              return EMPTY;
            }),
            finalize(() => this.paymentLoading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((payment) => this.acceptLoadedPayment(payment));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['codpag']) {
      return;
    }

    this.resetPaymentState();
    this.paymentRequests$.next(this.codpag());
  }

  protected close(): void {
    if (this.submitting()) {
      return;
    }

    this.receiptViewer?.releaseObjectUrl();
    this.closed.emit();
  }

  protected retryPayment(): void {
    if (!this.paymentLoading()) {
      this.resetPaymentState();
      this.paymentRequests$.next(this.codpag());
    }
  }

  protected handleReceiptLoaded(loaded: boolean): void {
    this.receiptLoaded.set(loaded);
  }

  protected beginConfirmation(): void {
    if (!this.canConfirm()) {
      return;
    }

    this.operationError.set(null);
    this.rejectionForm.set(false);
    this.confirmationPrompt.set(true);
    this.focusAfterRender('.cancel-confirmation');
  }

  protected cancelConfirmation(): void {
    this.confirmationPrompt.set(false);
    this.focusAfterRender('.confirm-payment-action');
  }

  protected confirmPayment(): void {
    if (!this.canConfirm() || !this.confirmationPrompt()) {
      return;
    }

    this.runDecision(() => this.paymentApi.confirmReview(this.codpag()));
  }

  protected rejectPayment(): void {
    if (!this.canReject()) {
      return;
    }

    this.runDecision(() =>
      this.paymentApi.rejectReview(this.codpag(), this.rejectionReason().trim()),
    );
  }

  protected beginRejection(): void {
    if (this.submitting() || this.reviewUnavailable()) {
      return;
    }

    this.operationError.set(null);
    this.confirmationPrompt.set(false);
    this.rejectionForm.set(true);
    this.focusAfterRender('#payment-rejection-reason');
  }

  protected cancelRejection(): void {
    this.rejectionForm.set(false);
    this.focusAfterRender('.reject-payment-action');
  }

  protected updateRejectionReason(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.rejectionReason.set(textarea.value);
    this.operationError.set(null);
  }

  protected rejectionReasonLength(): number {
    return this.rejectionReason().length;
  }

  protected canConfirm(): boolean {
    return Boolean(
      this.payment() &&
      this.receiptLoaded() &&
      !this.paymentLoading() &&
      !this.submitting() &&
      !this.reviewUnavailable(),
    );
  }

  protected canReject(): boolean {
    const reason = this.rejectionReason();

    return Boolean(
      this.payment() &&
      reason.trim().length > 0 &&
      reason.length <= MAX_REJECTION_REASON_LENGTH &&
      !this.submitting() &&
      !this.reviewUnavailable(),
    );
  }

  protected formatMoney(amount: number): string {
    return `Bs ${amount.toLocaleString('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  protected methodLabel(method: MetodoPago): string {
    return method === 'QR' ? 'QR' : 'Efectivo';
  }

  protected formatDateTime(value: string): string {
    const [date, time] = value.split('T');
    const [year, month, day] = date.split('-');

    if (!year || !month || !day) {
      return value;
    }

    return `${day}/${month}/${year}${time ? ` ${time.slice(0, 5)}` : ''}`;
  }

  protected formatPeriod(value: string): string {
    const match = /^(\d{4})-(\d{2})/.exec(value);

    if (!match) {
      return value;
    }

    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
    const formatted = new Intl.DateTimeFormat('es-BO', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })
      .format(date)
      .replace(/\s+de\s+/, ' ');

    return formatted.charAt(0).toLocaleUpperCase('es-BO') + formatted.slice(1);
  }

  private acceptLoadedPayment(payment: PagoResponse): void {
    if (
      payment.codpag !== this.codpag() ||
      payment.codcuo !== this.cuota().codcuo ||
      payment.estado !== 'PENDIENTE_REVISION' ||
      payment.origenRegistro !== 'INQUILINO'
    ) {
      this.markReviewUnavailable('Este pago ya no está pendiente de revisión.');
      return;
    }

    this.payment.set(payment);
  }

  private runDecision(request: () => ReturnType<PagoApiService['confirmReview']>): void {
    this.submitting.set(true);
    this.operationError.set(null);

    request()
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (payment) => this.reviewed.emit(payment),
        error: (error: unknown) => this.handleDecisionError(error),
      });
  }

  private handleDecisionError(error: unknown): void {
    if (
      error instanceof HttpErrorResponse &&
      (error.status === 404 || error.status === 409 || error.status === 422)
    ) {
      this.markReviewUnavailable(this.errorMessage(error));
      return;
    }

    this.operationError.set(this.errorMessage(error));
  }

  private errorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudo actualizar el pago.';
    }

    const detail = isProblemDetail(error.error) ? error.error.detail : null;

    if (detail) {
      return detail;
    }

    switch (error.status) {
      case 400:
        return 'Revisa los datos e inténtalo de nuevo.';
      case 403:
        return 'No tiene permisos para revisar este pago.';
      case 404:
        return 'El pago ya no está disponible.';
      case 409:
      case 422:
        return 'El estado del pago cambió. Se actualizaron las cuotas.';
      default:
        return 'No se pudo actualizar el pago.';
    }
  }

  private paymentLoadError(error: unknown): string {
    if (error instanceof HttpErrorResponse && isProblemDetail(error.error) && error.error.detail) {
      return error.error.detail;
    }

    if (error instanceof HttpErrorResponse && error.status === 403) {
      return 'No tiene permisos para consultar este pago.';
    }

    return 'No se pudo cargar el pago.';
  }

  private markReviewUnavailable(message: string): void {
    this.reviewUnavailable.set(true);
    this.operationError.set(message);
    this.refreshRequested.emit();
  }

  private resetPaymentState(): void {
    this.payment.set(null);
    this.paymentLoading.set(false);
    this.paymentError.set(null);
    this.receiptLoaded.set(false);
    this.operationError.set(null);
    this.submitting.set(false);
    this.rejectionReason.set('');
    this.confirmationPrompt.set(false);
    this.rejectionForm.set(false);
    this.reviewUnavailable.set(false);
  }

  private focusAfterRender(selector: string): void {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus(), {
      injector: this.injector,
    });
  }
}
