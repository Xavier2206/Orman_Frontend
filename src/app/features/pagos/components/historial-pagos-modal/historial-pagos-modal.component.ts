import { Component, DestroyRef, OnInit, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';

import { PersonaModalFocusDirective } from '../../../personas/components/persona-modal-focus.directive';
import { PagoApiService } from '../../../contratos/data/pago-api.service';
import type {
  MetodoPago,
  PagoEstado,
  PagoOrigenRegistro,
  PagoResponse,
} from '../../../contratos/models/contrato.model';
import type { CuotaListado } from '../../models/cuota-listado.model';
import { AnularPagoModalComponent } from '../anular-pago-modal/anular-pago-modal.component';

const PAYMENT_METHOD_LABELS: Record<MetodoPago, string> = {
  EFECTIVO: 'Efectivo',
  QR: 'QR',
};

const PAYMENT_METHOD_ICONS: Record<MetodoPago, string> = {
  EFECTIVO: 'payments',
  QR: 'qr_code_2',
};

const PAYMENT_STATUS_LABELS: Record<PagoEstado, string> = {
  CONFIRMADO: 'Confirmado',
  PENDIENTE_REVISION: 'Pendiente de revisión',
  RECHAZADO: 'Rechazado',
  ANULADO: 'Anulado',
};

const PAYMENT_STATUS_CLASSES: Record<PagoEstado, string> = {
  CONFIRMADO: 'history-status-confirmed',
  PENDIENTE_REVISION: 'history-status-pending',
  RECHAZADO: 'history-status-rejected',
  ANULADO: 'history-status-annulled',
};

const PAYMENT_ORIGIN_LABELS: Record<PagoOrigenRegistro, string> = {
  PROPIETARIA: 'Propietaria',
  INQUILINO: 'Inquilino',
};

@Component({
  selector: 'app-historial-pagos-modal',
  imports: [AnularPagoModalComponent, MatIconModule, PersonaModalFocusDirective],
  templateUrl: './historial-pagos-modal.component.html',
  styleUrl: './historial-pagos-modal.component.css',
})
export class HistorialPagosModalComponent implements OnInit {
  readonly cuota = input.required<CuotaListado>();
  readonly closed = output<void>();
  readonly paymentAnnulled = output<void>();

  private readonly paymentApi = inject(PagoApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly payments = signal<readonly PagoResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedPaymentToAnnul = signal<PagoResponse | null>(null);

  ngOnInit(): void {
    this.loadHistory();
  }

  protected close(): void {
    this.closed.emit();
  }

  protected retry(): void {
    this.loadHistory();
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

  protected formatMoney(value: number): string {
    return `Bs ${value.toLocaleString('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  protected formatDateTime(value: string): string {
    const [date, time] = value.split('T');
    const [year, month, day] = date.split('-');

    if (!year || !month || !day) {
      return value;
    }

    return `${day}/${month}/${year}${time ? ` ${time.slice(0, 5)}` : ''}`;
  }

  protected methodLabel(method: MetodoPago): string {
    return PAYMENT_METHOD_LABELS[method];
  }

  protected methodIcon(method: MetodoPago): string {
    return PAYMENT_METHOD_ICONS[method];
  }

  protected statusLabel(status: PagoEstado): string {
    return PAYMENT_STATUS_LABELS[status];
  }

  protected statusClass(status: PagoEstado): string {
    return PAYMENT_STATUS_CLASSES[status];
  }

  protected originLabel(origin: PagoOrigenRegistro): string {
    return PAYMENT_ORIGIN_LABELS[origin];
  }

  protected rejectionReason(payment: PagoResponse): string | null {
    return payment.estado === 'RECHAZADO' ? payment.motivoRechazo : null;
  }

  protected annulmentReason(payment: PagoResponse): string | null {
    return payment.estado === 'ANULADO' ? payment.motivoAnulacion : null;
  }

  protected canAnnulPayment(payment: PagoResponse): boolean {
    return (
      payment.estado === 'CONFIRMADO' &&
      payment.origenRegistro === 'PROPIETARIA' &&
      (payment.metodo === 'EFECTIVO' || payment.metodo === 'QR')
    );
  }

  protected annulActionLabel(payment: PagoResponse): string {
    return `Anular pago de ${this.formatMoney(payment.monto)} registrado el ${this.formatDateTime(payment.fechaPago)}`;
  }

  protected openAnnulment(payment: PagoResponse): void {
    this.selectedPaymentToAnnul.set(payment);
  }

  protected closeAnnulment(refreshHistory: boolean): void {
    this.selectedPaymentToAnnul.set(null);

    if (refreshHistory) {
      this.loadHistory();
    }
  }

  protected handlePaymentAnnulled(): void {
    this.selectedPaymentToAnnul.set(null);
    this.loadHistory();
    this.paymentAnnulled.emit();
  }

  private loadHistory(): void {
    this.loading.set(true);
    this.error.set(null);
    this.payments.set([]);

    this.paymentApi
      .listByInstallment(this.cuota().codcuo)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (payments) => this.payments.set(payments),
        error: () => {
          this.payments.set([]);
          this.error.set('No se pudo cargar el historial de pagos.');
        },
      });
  }
}
