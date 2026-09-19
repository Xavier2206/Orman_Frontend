import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, finalize, map, of, switchMap, tap } from 'rxjs';

import { isProblemDetail } from '../../../../core/api/problem-detail.model';
import { ContratoArchivoManagerComponent } from '../../components/contrato-archivo-manager/contrato-archivo-manager.component';
import { ContratoCuotasPanelComponent } from '../../components/contrato-cuotas-panel/contrato-cuotas-panel.component';
import { ContratoPagosModalComponent } from '../../components/contrato-pagos-modal/contrato-pagos-modal.component';
import { ContratoApiService } from '../../data/contrato-api.service';
import { CuotaApiService } from '../../data/cuota-api.service';
import { Contrato, CuotaResponse } from '../../models/contrato.model';

type DetailErrorKind = 'invalid' | 'not-found' | 'forbidden' | 'generic';
type DetailTab = 'cuotas' | 'documentos';

interface ContractPeriodSummary {
  readonly durationMonths: number;
  readonly elapsedMonths: number;
  readonly progress: number;
  readonly startLabel: string;
  readonly endLabel: string;
}

@Component({
  selector: 'app-contrato-detail',
  imports: [
    ContratoArchivoManagerComponent,
    ContratoCuotasPanelComponent,
    ContratoPagosModalComponent,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './contrato-detail.component.html',
  styleUrls: ['./contrato-detail.component.css', './contrato-detail-panels.css'],
})
export class ContratoDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly contratoApi = inject(ContratoApiService);
  private readonly cuotaApi = inject(CuotaApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly contract = signal<Contrato | null>(null);
  protected readonly installments = signal<readonly CuotaResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly installmentsLoading = signal(false);
  protected readonly installmentsError = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly errorKind = signal<DetailErrorKind | null>(null);
  protected readonly activeTab = signal<DetailTab>('cuotas');
  protected readonly selectedInstallment = signal<CuotaResponse | null>(null);
  protected readonly contractId = computed(() => this.contract()?.codcon ?? null);
  protected readonly periodSummary = computed(() => this.buildPeriodSummary(this.contract()));
  protected readonly partialInstallments = computed(() => {
    if (this.installmentsError() !== null) {
      return null;
    }

    return this.installments().filter((installment) => installment.estado === 'PARCIAL').length;
  });
  protected readonly totalContractValue = computed(() => {
    const contract = this.contract();
    const durationMonths = this.periodSummary().durationMonths;
    return contract !== null && durationMonths > 0 ? durationMonths * contract.montoMensual : null;
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => this.parseIdentifier(params.get('codcon'))),
        distinctUntilChanged(),
        switchMap((codcon) => this.loadDetail(codcon)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected selectTab(tab: DetailTab): void {
    this.activeTab.set(tab);
  }

  protected openPayments(installment: CuotaResponse): void {
    this.selectedInstallment.set(installment);
  }

  protected closePayments(): void {
    this.selectedInstallment.set(null);
  }

  protected fullName(contract: Contrato): string {
    return contract.inquilino?.nombreCompleto || `Inquilino #${contract.codperInquilino}`;
  }

  protected initials(contract: Contrato): string {
    return this.fullName(contract)
      .split(' ')
      .filter((part) => part.length > 0)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('');
  }

  protected statusLabel(status: Contrato['estado']): string {
    return status;
  }

  protected formatDate(value: string): string {
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  }

  protected formatMoney(value: number, currency: string): string {
    return `${currency === 'BOB' ? 'Bs' : currency} ${value.toLocaleString('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  protected optionalLabel(value: string | number | null | undefined): string {
    return value === null || value === undefined || value === '' ? 'No registrado' : String(value);
  }

  protected countLabel(value: number | null | undefined): string {
    return value === null || value === undefined ? '—' : value.toLocaleString('es-BO');
  }

  protected moneyLabel(value: number | null | undefined, currency: string): string {
    return value === null || value === undefined ? 'No disponible' : this.formatMoney(value, currency);
  }

  protected statusClass(status: Contrato['estado']): string {
    return `contract-status-${status.toLowerCase()}`;
  }

  private parseIdentifier(value: string | null): number | null {
    if (value === null) {
      return null;
    }

    const identifier = Number(value);
    return Number.isSafeInteger(identifier) && identifier > 0 ? identifier : null;
  }

  private buildPeriodSummary(contract: Contrato | null): ContractPeriodSummary {
    if (contract === null) {
      return {
        durationMonths: 0,
        elapsedMonths: 0,
        progress: 0,
        startLabel: 'No registrado',
        endLabel: 'No registrado',
      };
    }

    const startDate = this.parseLocalDate(contract.fechaInicio);
    const endDate = this.parseLocalDate(contract.fechaFin);
    const durationMonths = this.durationMonths(contract, startDate, endDate);
    const now = new Date();
    let elapsedMonths = 0;

    if (startDate !== null && endDate !== null && durationMonths > 0) {
      if (now >= endDate) {
        elapsedMonths = durationMonths;
      } else if (now >= startDate) {
        elapsedMonths = Math.min(durationMonths, this.monthDifference(startDate, now));
      }
    }

    return {
      durationMonths,
      elapsedMonths,
      progress: durationMonths === 0 ? 0 : Math.round((elapsedMonths / durationMonths) * 100),
      startLabel: this.formatDate(contract.fechaInicio),
      endLabel: this.formatDate(contract.fechaFin),
    };
  }

  private durationMonths(contract: Contrato, startDate: Date | null, endDate: Date | null): number {
    const responseDuration = contract.cuotas?.totalCuotas;
    if (responseDuration !== null && responseDuration !== undefined && responseDuration > 0) {
      return responseDuration;
    }

    return startDate === null || endDate === null ? 0 : this.monthDifference(startDate, endDate);
  }

  private parseLocalDate(value: string): Date | null {
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
      return null;
    }

    return new Date(year, month - 1, day);
  }

  private monthDifference(startDate: Date, endDate: Date): number {
    return Math.max(
      0,
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        endDate.getMonth() -
        startDate.getMonth(),
    );
  }

  private loadDetail(codcon: number | null) {
    this.resetDetailState();

    if (codcon === null) {
      this.loading.set(false);
      this.errorKind.set('invalid');
      this.error.set('El identificador del contrato no es válido.');
      return of(null);
    }

    return this.contratoApi.get(codcon).pipe(
      switchMap((contract) => {
        this.contract.set(contract);
        this.installmentsLoading.set(true);
        return this.cuotaApi.listByContract(contract.codcon).pipe(
          tap((installments) => this.installments.set(installments)),
          catchError((requestError: unknown) => {
            this.installments.set([]);
            this.installmentsError.set(this.installmentsErrorMessage(requestError));
            return of<readonly CuotaResponse[]>([]);
          }),
          finalize(() => this.installmentsLoading.set(false)),
        );
      }),
      tap(() => this.loading.set(false)),
      catchError((requestError: unknown) => {
        this.contract.set(null);
        this.errorKind.set(this.errorKindFor(requestError));
        this.error.set(this.errorMessage(requestError));
        return of(null);
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  private resetDetailState(): void {
    this.loading.set(true);
    this.contract.set(null);
    this.installments.set([]);
    this.installmentsError.set(null);
    this.installmentsLoading.set(false);
    this.error.set(null);
    this.errorKind.set(null);
    this.activeTab.set('cuotas');
    this.selectedInstallment.set(null);
  }

  private errorKindFor(requestError: unknown): DetailErrorKind {
    if (!(requestError instanceof HttpErrorResponse)) {
      return 'generic';
    }

    if (requestError.status === 404) {
      return 'not-found';
    }

    if (requestError.status === 403) {
      return 'forbidden';
    }

    return 'generic';
  }

  private errorMessage(requestError: unknown): string {
    if (requestError instanceof HttpErrorResponse && isProblemDetail(requestError.error)) {
      return requestError.error.detail?.trim() || 'No fue posible cargar el contrato.';
    }

    if (requestError instanceof HttpErrorResponse && requestError.status === 404) {
      return 'El contrato solicitado no existe o no puede consultarse.';
    }

    if (requestError instanceof HttpErrorResponse && requestError.status === 403) {
      return 'No tienes permisos para consultar este contrato.';
    }

    return 'No fue posible cargar el contrato. Inténtalo nuevamente.';
  }

  private installmentsErrorMessage(requestError: unknown): string {
    if (requestError instanceof HttpErrorResponse && requestError.status === 403) {
      return 'No tienes permisos para consultar las cuotas de este contrato.';
    }

    if (requestError instanceof HttpErrorResponse && requestError.status === 404) {
      return 'No se encontraron cuotas para este contrato.';
    }

    return 'No fue posible cargar las cuotas. Inténtalo nuevamente.';
  }
}
