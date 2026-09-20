import { Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { PersonaModalFocusDirective } from '../../../personas/components/persona-modal-focus.directive';
import { Contrato, CuotaResponse } from '../../models/contrato.model';

@Component({
  selector: 'app-contrato-finalize-modal',
  imports: [MatIconModule, PersonaModalFocusDirective],
  templateUrl: './contrato-finalize-modal.component.html',
  styleUrls: [
    '../contrato-action-modal/contrato-action-modal.css',
    './contrato-finalize-modal.component.css',
  ],
})
export class ContratoFinalizeModalComponent {
  readonly contract = input.required<Contrato>();
  readonly installments = input<readonly CuotaResponse[]>([]);
  readonly installmentsLoading = input(false);
  readonly installmentsError = input<string | null>(null);
  readonly submitting = input(false);
  readonly feedback = input<string | null>(null);
  readonly confirmed = output<void>();
  readonly closed = output<void>();

  protected readonly validation = computed(() => {
    const contract = this.contract();
    const installments = this.installments();
    const allPaid =
      installments.length > 0
        ? installments.every((installment) => installment.estado === 'PAGADA')
        : contract.cuotas?.totalCuotas === 0;

    return {
      endReached: this.parseDate(contract.fechaFin) <= new Date(),
      allPaid,
      noPendingReview: installments.every((installment) => installment.montoPendienteRevision === 0),
    };
  });

  protected canConfirm(): boolean {
    const validation = this.validation();

    return (
      !this.installmentsLoading() &&
      this.installmentsError() === null &&
      validation.endReached &&
      validation.allPaid &&
      validation.noPendingReview
    );
  }

  protected tenantName(): string {
    return this.contract().inquilino?.nombreCompleto || `Inquilino #${this.contract().codperInquilino}`;
  }

  protected unitName(): string {
    return this.contract().unidad?.nombre || `Unidad #${this.contract().coduni}`;
  }

  protected formatDate(value: string): string {
    const [year, month, day] = value.slice(0, 10).split('-');

    return year && month && day ? `${day}/${month}/${year}` : value;
  }

  protected formatMoney(value: number): string {
    return `${this.contract().moneda === 'BOB' ? 'Bs' : this.contract().moneda} ${value.toLocaleString(
      'es-BO',
      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    )}`;
  }

  protected close(): void {
    if (!this.submitting()) {
      this.closed.emit();
    }
  }

  protected confirm(): void {
    if (this.canConfirm()) {
      this.confirmed.emit();
    }
  }

  private parseDate(value: string): Date {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);

    return new Date(year, month - 1, day);
  }
}
