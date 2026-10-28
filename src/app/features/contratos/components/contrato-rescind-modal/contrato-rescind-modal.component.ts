import { Component, OnChanges, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { PersonaModalFocusDirective } from '../../../personas/components/persona-modal-focus.directive';
import { Contrato, ContratoRescindRequest, CuotaResponse } from '../../models/contrato.model';

interface ContractMonth {
  readonly value: string;
  readonly label: string;
}

interface ConfirmedPeriod {
  readonly value: string;
  readonly monthIndex: number;
  readonly amount: number;
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
  imports: [FormsModule, MatIconModule, PersonaModalFocusDirective],
  templateUrl: './contrato-rescind-modal.component.html',
  styleUrls: [
    '../contrato-action-modal/contrato-action-modal.css',
    './contrato-rescind-modal.component.css',
  ],
})
export class ContratoRescindModalComponent implements OnChanges {
  readonly contract = input.required<Contrato>();
  readonly installments = input<readonly CuotaResponse[]>([]);
  readonly installmentsLoading = input(false);
  readonly installmentsError = input<string | null>(null);
  readonly submitting = input(false);
  readonly feedback = input<string | null>(null);
  readonly confirmed = output<ContratoRescindRequest>();
  readonly closed = output<void>();
  readonly retryInstallments = output<void>();

  protected readonly reason = signal('');
  protected readonly selectedMonth = signal('');
  protected readonly selectionNotice = signal<string | null>(null);
  protected readonly validMonths = computed(() => this.buildValidMonths(this.contract()));
  protected readonly latestConfirmedPeriod = computed(() =>
    this.buildLatestConfirmedPeriod(this.installments()),
  );
  protected readonly selectableMonths = computed(() =>
    this.validMonths().filter((month) => !this.isMonthBlocked(month)),
  );
  protected readonly noSelectableMonthMessage = computed(() => {
    if (this.selectableMonths().length > 0) {
      return null;
    }

    if (this.validMonths().length === 0) {
      return 'No hay ningún mes que cumpla el inicio del contrato, la fecha final exclusiva y el límite de no futuro.';
    }

    const latestConfirmed = this.latestConfirmedPeriod();

    if (latestConfirmed) {
      return `El último período con dinero confirmado es ${this.formatMonth(latestConfirmed.value)} (${this.formatMoney(latestConfirmed.amount)}). Está después de los meses permitidos por contrato y fecha actual, por lo que no existe un corte permitido.`;
    }

    return 'No hay meses que cumplan las fechas permitidas del contrato para rescindir.';
  });
  protected readonly effectiveMonth = computed(() => {
    const selected = this.selectedMonth();
    const available = this.selectableMonths();

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
      noLaterConfirmedPayment: this.hasNoLaterConfirmedPayment(),
    };
  });

  ngOnChanges(): void {
    this.reconcileSelectedMonth();
  }

  protected canConfirm(): boolean {
    const validation = this.validation();

    return (
      !this.submitting() &&
      !this.installmentsLoading() &&
      this.installmentsError() === null &&
      validation.hasMonth &&
      validation.hasReason &&
      validation.allDemandedPaid &&
      validation.noPendingReview &&
      validation.noLaterConfirmedPayment
    );
  }

  protected isMonthBlocked(month: ContractMonth): boolean {
    const latestConfirmed = this.latestConfirmedPeriod();
    const monthIndex = this.monthIndex(month.value);

    return (
      latestConfirmed !== null && monthIndex !== null && monthIndex < latestConfirmed.monthIndex
    );
  }

  protected installmentStateLabel(state: CuotaResponse['estado']): string {
    const labels: Record<CuotaResponse['estado'], string> = {
      PENDIENTE: 'Pendiente',
      PARCIAL: 'Parcial',
      PAGADA: 'Pagada',
      ANULADA: 'Anulada',
    };

    return labels[state];
  }

  protected retryLoad(): void {
    this.retryInstallments.emit();
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
    return (
      this.contract().inquilino?.nombreCompleto || `Inquilino #${this.contract().codperInquilino}`
    );
  }

  protected unitName(): string {
    return this.contract().unidad?.nombre || `Unidad #${this.contract().coduni}`;
  }

  protected onMonthChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    this.selectedMonth.set(
      this.selectableMonths().some((month) => month.value === value) ? value : '',
    );
    this.selectionNotice.set(null);
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
        pendingReview: installments.some((installment) => installment.montoPendienteRevision > 0),
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
      pendingReview: installments.some((installment) => installment.montoPendienteRevision > 0),
    };
  }

  private buildValidMonths(contract: Contrato): readonly ContractMonth[] {
    const startDate = contract.fechaInicio.slice(0, 10);
    const endDate = contract.fechaFin.slice(0, 10);
    const start = this.monthIndex(startDate);
    const end = this.monthIndex(endDate);
    const current = this.monthIndex(this.currentMonthValue());

    if (
      start === null ||
      end === null ||
      current === null ||
      !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
    ) {
      return [];
    }

    const lastMonth = Math.min(end, current);
    const months: ContractMonth[] = [];

    for (let index = start; index <= lastMonth; index += 1) {
      const year = Math.floor((index - 1) / 12);
      const month = index - year * 12;
      const value = `${year}-${String(month).padStart(2, '0')}`;
      const effectiveDate = `${value}-01`;

      if (effectiveDate >= startDate && effectiveDate < endDate) {
        months.push({ value, label: this.formatMonth(value) });
      }
    }

    return months;
  }

  private buildLatestConfirmedPeriod(
    installments: readonly CuotaResponse[],
  ): ConfirmedPeriod | null {
    const confirmed = installments
      .filter((installment) => installment.montoConfirmado > 0)
      .map((installment) => ({
        value: installment.periodo.slice(0, 7),
        monthIndex: this.monthIndex(installment.periodo),
        amount: installment.montoConfirmado,
      }))
      .filter((period): period is ConfirmedPeriod => period.monthIndex !== null);

    if (confirmed.length === 0) {
      return null;
    }

    const latestIndex = Math.max(...confirmed.map((period) => period.monthIndex));
    const latestPeriods = confirmed.filter((period) => period.monthIndex === latestIndex);

    return {
      value: latestPeriods[0].value,
      monthIndex: latestIndex,
      amount: latestPeriods.reduce((total, period) => total + period.amount, 0),
    };
  }

  private hasNoLaterConfirmedPayment(): boolean {
    const cutoff = this.monthIndex(this.effectiveMonth());

    return (
      cutoff !== null &&
      !this.installments().some((installment) => {
        const period = this.monthIndex(installment.periodo);

        return period !== null && period > cutoff && installment.montoConfirmado > 0;
      })
    );
  }

  private reconcileSelectedMonth(): void {
    const selected = this.selectedMonth();

    if (!selected) {
      return;
    }

    const selectedIndex = this.monthIndex(selected);
    const latestConfirmed = this.latestConfirmedPeriod();

    if (
      selectedIndex === null ||
      this.selectableMonths().some((month) => month.value === selected)
    ) {
      return;
    }

    this.selectedMonth.set('');

    if (latestConfirmed && selectedIndex < latestConfirmed.monthIndex) {
      this.selectionNotice.set(
        `Se limpió el último mes a cobrar porque hay dinero confirmado en ${this.formatMonth(latestConfirmed.value)} por ${this.formatMoney(latestConfirmed.amount)}.`,
      );
      return;
    }

    this.selectionNotice.set(
      'Se limpió el último mes a cobrar porque ya no cumple las fechas permitidas del contrato.',
    );
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
