import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  OnChanges,
  SimpleChanges,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';

import { PersonaModalFocusDirective } from '../../../personas/components/persona-modal-focus.directive';
import { PagoApiService } from '../../data/pago-api.service';
import { CuotaResponse, PagoResponse } from '../../models/contrato.model';

@Component({
  selector: 'app-contrato-pagos-modal',
  imports: [MatIconModule, PersonaModalFocusDirective],
  templateUrl: './contrato-pagos-modal.component.html',
  styleUrl: './contrato-pagos-modal.component.css',
})
export class ContratoPagosModalComponent implements OnChanges {
  readonly installment = input<CuotaResponse | null>(null);
  readonly currency = input('BOB');
  readonly closed = output<void>();

  private readonly paymentApi = inject(PagoApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly payments = signal<readonly PagoResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (!('installment' in changes)) {
      return;
    }

    const installment = this.installment();
    if (installment === null) {
      this.payments.set([]);
      this.error.set(null);
      return;
    }

    this.loadPayments(installment.codcuo);
  }

  protected close(): void {
    if (!this.loading()) {
      this.closed.emit();
    }
  }

  protected formatMoney(value: number): string {
    return `${this.currency() === 'BOB' ? 'Bs' : this.currency()} ${value.toLocaleString('es-BO', {
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

  protected methodLabel(method: PagoResponse['metodo']): string {
    const labels: Record<PagoResponse['metodo'], string> = {
      EFECTIVO: 'Efectivo',
      QR: 'QR',
    };

    return labels[method] ?? method;
  }

  protected statusLabel(status: PagoResponse['estado']): string {
    return status.replaceAll('_', ' ');
  }

  private loadPayments(codcuo: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.paymentApi
      .listByInstallment(codcuo)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (payments) => this.payments.set(payments),
        error: (requestError: unknown) => {
          this.payments.set([]);
          this.error.set(this.errorMessage(requestError));
        },
      });
  }

  private errorMessage(requestError: unknown): string {
    if (requestError instanceof HttpErrorResponse) {
      if (requestError.status === 403) {
        return 'No tienes permisos para consultar los pagos de esta cuota.';
      }

      if (requestError.status === 404) {
        return 'No se encontró la cuota solicitada.';
      }
    }

    return 'No fue posible cargar los pagos. Inténtalo nuevamente.';
  }
}
