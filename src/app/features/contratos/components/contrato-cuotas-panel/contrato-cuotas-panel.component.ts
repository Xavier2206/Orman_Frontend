import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { CuotaResponse } from '../../models/contrato.model';

@Component({
  selector: 'app-contrato-cuotas-panel',
  imports: [MatIconModule],
  templateUrl: './contrato-cuotas-panel.component.html',
  styleUrl: './contrato-cuotas-panel.component.css',
})
export class ContratoCuotasPanelComponent {
  readonly installments = input<readonly CuotaResponse[]>([]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly currency = input('BOB');
  readonly viewPayments = output<CuotaResponse>();

  protected paymentCountLabel(): string {
    const count = this.installments().length;
    return count === 1 ? '1 cuota registrada' : `${count} cuotas registradas`;
  }

  protected formatDate(value: string): string {
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  }

  protected formatMoney(value: number): string {
    return `${this.currency() === 'BOB' ? 'Bs' : this.currency()} ${value.toLocaleString('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  protected isPaidInstallment(installment: CuotaResponse): boolean {
    return installment.estado === 'PAGADA';
  }

  protected isPendingInstallment(installment: CuotaResponse): boolean {
    return installment.estado === 'PENDIENTE' || installment.estado === 'PARCIAL';
  }

  protected installmentStatusLabel(status: CuotaResponse['estado']): string {
    return status;
  }

  protected statusClass(status: CuotaResponse['estado']): string {
    return status.toLowerCase();
  }
}
