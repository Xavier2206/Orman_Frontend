import { Component, computed, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { PersonaModalFocusDirective } from '../../../personas/components/persona-modal-focus.directive';
import {
  Contrato,
  ContratoRescindRequest,
  CuotaResponse,
} from '../../models/contrato.model';

interface ContractMonth {
  readonly value: string;
  readonly label: string;
}

interface RescissionSummary {
  readonly demanded: readonly CuotaResponse[];
  readonly subsequent: readonly CuotaResponse[];
  readonly paid: number;
  readonly pending: number;
  readonly balance: number;
  readonly pendingReview: boolean;
}

@Component({
  selector: 'app-contrato-rescind-modal',
  imports: [MatIconModule, PersonaModalFocusDirective],
  templateUrl: './contrato-rescind-modal.component.html',
  styleUrls: [
    '../contrato-action-modal/contrato-action-modal.css',
    './contrato-rescind-modal.component.css',
  ],
})
export class ContratoRescindModalComponent {
  readonly contract = input.required<Contrato>();
  readonly installments = input<readonly CuotaResponse[]>([]);
  readonly installmentsLoading = input(false);
  readonly installmentsError = input<string | null>(null);
  readonly submitting = input(false);
  readonly feedback = input<string | null>(null);
  readonly confirmed = output<ContratoRescindRequest>();
  readonly closed = output<void>();

  protected readonly reason = signal('');
  protected readonly selectedMonth = signal('');
  protected readonly validMonths = computed(() => this.buildValidMonths(this.contract()));
  protected readonly effectiveMonth = computed(() => {
    const selected = this.selectedMonth();
    const available = this.validMonths();

    return available.some((month) => month.value === selected) ? selected : '';
  });
  protected readonly demandedInstallments = computed(() => this.buildSummary().demanded);
  protected readonly subsequentInstallments = computed(() => this.buildSummary().subsequent);
  protected readonly summary = computed(() => this.buildSummary());
  protected readonly validation = computed(() => {
    const summary = this.summary();
    const hasMonth = this.effectiveMonth().length > 0;
    const hasReason = this.reason().trim().length > 0;

    return {
      hasMonth,
      hasReason,
      allDemandedPaid: summary.pending === 0 && summary.demanded.length > 0,
      noPendingReview: !summary.pendingReview,
    };
  });

  protected canConfirm(): boolean {
    const validation = this.validation();

    return (
      !this.installmentsLoading() &&
      this.installmentsError() === null &&
      validation.hasMonth &&
      validation.hasReason
    );
  }

  protected formalCloseDate(): string {
    const month = this.effectiveMonth();

    if (!month) {
      return 'No disponible';
    }

    const [year, monthNumber] = month.split('-').map(Number);
    const lastDay = new Date(year, monthNumber, 0).getDate();

    return `${String(lastDay).padStart(2, '0')}/${String(monthNumber).padStart(2, '0')}/${year}`;
  }

  protected formatMonth(value: string): string {
    const [year, month] = value.split('-').map(Number);
    const label = new Date(year, month - 1, 1).toLocaleDateString('es-BO', {
      month: 'long',
      year: 'numeric',
    });

    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  protected formatInstallmentPeriod(installment: CuotaResponse): string {
    return this.formatMonth(installment.periodo.slice(0, 7));
  }

  protected formatMoney(value: number): string {
    return `${this.contract().moneda === 'BOB' ? 'Bs' : this.contract().moneda} ${value.toLocaleString(
      'es-BO',
      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    )}`;
  }

  protected formatDate(value: string): string {
    const [year, month, day] = value.slice(0, 10).split('-');

    return year && month && day ? `${day}/${month}/${year}` : value;
  }

  protected tenantName(): string {
    return this.contract().inquilino?.nombreCompleto || `Inquilino #${this.contract().codperInquilino}`;
  }

  protected unitName(): string {
    return this.contract().unidad?.nombre || `Unidad #${this.contract().coduni}`;
  }

  protected onMonthChange(event: Event): void {
    this.selectedMonth.set((event.target as HTMLSelectElement).value);
  }

  protected onReasonInput(event: Event): void {
    this.reason.set((event.target as HTMLTextAreaElement).value.slice(0, 500));
  }

  protected remainingCharacters(): number {
    return 500 - this.reason().length;
  }

  protected submit(): void {
    if (!this.canConfirm()) {
      return;
    }

    this.confirmed.emit({
      fechaRescision: `${this.effectiveMonth()}-01`,
      motivoRescision: this.reason().trim(),
    });
  }

  protected close(): void {
    if (!this.submitting()) {
      this.closed.emit();
    }
  }

  private buildSummary(): RescissionSummary {
    const cutoff = this.monthIndex(this.effectiveMonth());
    const installments = this.installments();

    if (cutoff === null) {
      return {
        demanded: [],
        subsequent: [],
        paid: 0,
        pending: 0,
        balance: 0,
        pendingReview: false,
      };
    }

    const demanded = installments.filter((installment) => {
      const month = this.monthIndex(installment.periodo);
      return month !== null && month <= cutoff && installment.estado !== 'ANULADA';
    });
    const subsequent = installments.filter((installment) => {
      const month = this.monthIndex(installment.periodo);
      return month !== null && month > cutoff && installment.estado !== 'ANULADA';
    });

    return {
      demanded,
      subsequent,
      paid: demanded.filter((installment) => installment.estado === 'PAGADA').length,
      pending: demanded.filter((installment) => installment.estado !== 'PAGADA').length,
      balance: demanded.reduce((total, installment) => total + installment.saldo, 0),
      pendingReview: demanded.some((installment) => installment.montoPendienteRevision > 0),
    };
  }

  private buildValidMonths(contract: Contrato): readonly ContractMonth[] {
    const start = this.monthIndex(contract.fechaInicio);
    const end = this.monthIndex(contract.fechaFin);
    const current = this.monthIndex(this.currentMonthValue());

    if (start === null || end === null || current === null) {
      return [];
    }

    const lastMonth = Math.min(end, current);
    const months: ContractMonth[] = [];

    for (let index = start; index <= lastMonth; index += 1) {
      const year = Math.floor((index - 1) / 12);
      const month = index - year * 12;
      const value = `${year}-${String(month).padStart(2, '0')}`;

      months.push({ value, label: this.formatMonth(value) });
    }

    return months;
  }

  private currentMonthValue(): string {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private monthIndex(value: string): number | null {
    const [yearText, monthText] = value.slice(0, 7).split('-');
    const year = Number(yearText);
    const month = Number(monthText);

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return null;
    }

    return year * 12 + month;
  }
}
