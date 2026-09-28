import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import type { CuotaEstado, PagoResponse } from '../../../contratos/models/contrato.model';
import { CuotaListado } from '../../models/cuota-listado.model';

export interface PagoRevisionSeleccion {
  readonly cuota: CuotaListado;
  readonly pago: PagoResponse;
}

@Component({
  selector: 'app-cuota-table',
  imports: [MatIconModule],
  templateUrl: './cuota-table.component.html',
  styleUrl: './cuota-table.component.css',
})
export class CuotaTableComponent {
  readonly cuotas = input.required<readonly CuotaListado[]>();
  readonly pagosPendientesRevision = input<ReadonlyMap<number, readonly PagoResponse[]>>(new Map());
  readonly erroresRevision = input<ReadonlySet<number>>(new Set());
  readonly focusCodcuo = input<number | null>(null);
  readonly registerPayment = output<CuotaListado>();
  readonly reviewPayment = output<PagoRevisionSeleccion>();
  readonly viewPaymentHistory = output<CuotaListado>();
  protected readonly highlightedCodcuo = signal<number | null>(null);

  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private lastFocusedCodcuo: number | null = null;
  private highlightTimeout: number | null = null;

  constructor() {
    effect(() => {
      const codcuo = this.focusCodcuo();

      if (codcuo === null) {
        this.lastFocusedCodcuo = null;
        this.highlightedCodcuo.set(null);
        this.clearHighlightTimeout();
        return;
      }

      if (
        this.lastFocusedCodcuo !== codcuo &&
        this.cuotas().some((quota) => quota.codcuo === codcuo)
      ) {
        this.lastFocusedCodcuo = codcuo;
        afterNextRender(() => this.focusQuotaRow(codcuo), { injector: this.injector });
      }
    });

    this.destroyRef.onDestroy(() => this.clearHighlightTimeout());
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

  protected formatDate(value: string): string {
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  }

  protected formatMoney(value: number): string {
    return `Bs ${value.toLocaleString('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  protected statusClass(status: CuotaEstado): string {
    return `quota-status-${status.toLowerCase()}`;
  }

  protected dueLabel(situation: CuotaListado['situacionVencimiento']): string {
    switch (situation) {
      case 'VENCIDA':
        return 'Vencida';
      case 'HOY':
        return 'Hoy';
      case 'PROXIMA':
        return 'Próxima';
      case 'AL_DIA':
        return 'Al día';
      case 'SIN_SALDO':
        return '';
    }
  }

  protected dueClass(situation: CuotaListado['situacionVencimiento']): string {
    switch (situation) {
      case 'VENCIDA':
        return 'quota-due-overdue';
      case 'HOY':
        return 'quota-due-today';
      case 'PROXIMA':
        return 'quota-due-soon';
      case 'AL_DIA':
        return 'quota-due-current';
      case 'SIN_SALDO':
        return '';
    }
  }

  protected showRegisterAction(quota: CuotaListado): boolean {
    return quota.saldo > 0 && quota.estado !== 'PAGADA' && quota.estado !== 'ANULADA';
  }

  protected pendingReviewPayments(quota: CuotaListado): readonly PagoResponse[] {
    return (this.pagosPendientesRevision().get(quota.codcuo) ?? []).filter(
      (payment) =>
        payment.codcuo === quota.codcuo &&
        payment.estado === 'PENDIENTE_REVISION' &&
        payment.origenRegistro === 'INQUILINO',
    );
  }

  protected hasReviewLookupError(quota: CuotaListado): boolean {
    return this.erroresRevision().has(quota.codcuo);
  }

  protected reviewActionLabel(quota: CuotaListado, payment: PagoResponse): string {
    return `Revisar pago ${payment.codpag} de la cuota ${quota.codcuo}`;
  }

  protected historyLabel(quota: CuotaListado): string {
    return `Ver historial de pagos de ${this.formatPeriod(quota.periodo)}, cuota ${quota.codcuo}`;
  }

  private focusQuotaRow(codcuo: number): void {
    if (this.focusCodcuo() !== codcuo) {
      return;
    }

    const row = this.hostElement.nativeElement.querySelector<HTMLElement>(
      `[data-codcuo="${codcuo}"]`,
    );

    if (!row) {
      return;
    }

    const prefersReducedMotion =
      this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    row.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
    this.highlightedCodcuo.set(codcuo);
    this.clearHighlightTimeout();
    this.highlightTimeout =
      this.document.defaultView?.setTimeout(() => {
        if (this.highlightedCodcuo() === codcuo) {
          this.highlightedCodcuo.set(null);
        }
      }, 4000) ?? null;
  }

  private clearHighlightTimeout(): void {
    if (this.highlightTimeout === null) {
      return;
    }

    this.document.defaultView?.clearTimeout(this.highlightTimeout);
    this.highlightTimeout = null;
  }
}
