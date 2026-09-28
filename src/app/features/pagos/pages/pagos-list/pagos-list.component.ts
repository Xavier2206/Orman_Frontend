import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  distinctUntilChanged,
  finalize,
  map,
  of,
  switchMap,
} from 'rxjs';

import { isProblemDetail } from '../../../../core/api/problem-detail.model';
import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import type { CuotaEstado, PagoResponse } from '../../../contratos/models/contrato.model';
import { PageResponse } from '../../../personas/models/persona.model';
import { Propiedad } from '../../../propiedades/models/propiedad.model';
import { UnidadResponse } from '../../../unidades/models/unidad.model';
import { CuotaFilterSelectComponent } from '../../components/cuota-filter-select/cuota-filter-select.component';
import {
  CuotaTableComponent,
  PagoRevisionSeleccion,
} from '../../components/cuota-table/cuota-table.component';
import { HistorialPagosModalComponent } from '../../components/historial-pagos-modal/historial-pagos-modal.component';
import { RegistrarPagoModalComponent } from '../../components/registrar-pago-modal/registrar-pago-modal.component';
import { RevisarPagoModalComponent } from '../../components/revisar-pago-modal/revisar-pago-modal.component';
import { CuotaCatalogService } from '../../data/cuota-catalog.service';
import { CuotaListadoApiService } from '../../data/cuota-listado-api.service';
import { PagoRevisionLookupService } from '../../data/pago-revision-lookup.service';
import {
  CuotaFiltroOpcion,
  CuotaListado,
  CuotaListadoFilters,
  CuotaVencimientoFiltro,
  InquilinoCuota,
} from '../../models/cuota-listado.model';

interface CuotaFiltrosUi {
  readonly inquilino: string;
  readonly periodoMes: string;
  readonly estado: string;
  readonly vencimiento: string;
  readonly propiedad: string;
  readonly unidad: string;
  readonly pagoPendienteRevision: boolean;
}

interface UnidadRequestResult {
  readonly codprop: number | null;
  readonly unidades: readonly UnidadResponse[];
  readonly error: string | null;
}

const EMPTY_FILTERS: CuotaFiltrosUi = {
  inquilino: '',
  periodoMes: '',
  estado: '',
  vencimiento: '',
  propiedad: '',
  unidad: '',
  pagoPendienteRevision: false,
};

const PAGE_SIZE = 20;

@Component({
  selector: 'app-pagos-list',
  imports: [
    MatIconModule,
    CuotaFilterSelectComponent,
    CuotaTableComponent,
    HistorialPagosModalComponent,
    RegistrarPagoModalComponent,
    RevisarPagoModalComponent,
  ],
  templateUrl: './pagos-list.component.html',
  styleUrl: './pagos-list.component.css',
})
export class PagosListComponent {
  private readonly cuotaApi = inject(CuotaListadoApiService);
  private readonly catalogApi = inject(CuotaCatalogService);
  private readonly reviewLookup = inject(PagoRevisionLookupService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notification = inject(OrmanNotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly listRequests$ = new Subject<boolean>();
  private readonly unitRequests$ = new Subject<number | null>();
  private readonly reviewPaymentRequests$ = new Subject<readonly CuotaListado[]>();

  protected readonly filters = signal<CuotaFiltrosUi>(EMPTY_FILTERS);
  protected readonly page = signal<PageResponse<CuotaListado> | null>(null);
  protected readonly currentPage = signal(0);
  protected readonly notificationQuotaRequested = signal(false);
  protected readonly notificationQuotaNotFound = signal(false);
  protected readonly notificationCodcuo = signal<number | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly moreFiltersExpanded = signal(false);
  protected readonly selectedQuota = signal<CuotaListado | null>(null);
  protected readonly selectedHistoryQuota = signal<CuotaListado | null>(null);
  protected readonly selectedReviewPayment = signal<PagoRevisionSeleccion | null>(null);
  protected readonly pendingReviewPayments = signal<ReadonlyMap<number, readonly PagoResponse[]>>(
    new Map(),
  );
  protected readonly pendingReviewLookupErrors = signal<ReadonlySet<number>>(new Set());

  protected readonly tenants = signal<readonly InquilinoCuota[]>([]);
  protected readonly tenantLoading = signal(true);
  protected readonly tenantError = signal<string | null>(null);
  protected readonly properties = signal<readonly Propiedad[]>([]);
  protected readonly propertyLoading = signal(true);
  protected readonly propertyError = signal<string | null>(null);
  protected readonly units = signal<readonly UnidadResponse[]>([]);
  protected readonly unitLoading = signal(false);
  protected readonly unitError = signal<string | null>(null);

  protected readonly hasFilters = computed(() => {
    const filters = this.filters();

    return Boolean(
      filters.inquilino ||
      filters.periodoMes ||
      filters.estado ||
      filters.vencimiento ||
      filters.propiedad ||
      filters.unidad ||
      filters.pagoPendienteRevision,
    );
  });

  protected readonly tenantOptions = computed<readonly CuotaFiltroOpcion[]>(() => [
    { value: '', label: 'Todos los inquilinos' },
    ...this.tenants().map((tenant) => ({
      value: String(tenant.codper),
      label: tenant.nombreCompleto,
    })),
  ]);

  protected readonly propertyOptions = computed<readonly CuotaFiltroOpcion[]>(() => [
    { value: '', label: 'Todas las propiedades' },
    ...this.properties().map((property) => ({
      value: String(property.codprop),
      label: property.nombre,
    })),
  ]);

  protected readonly unitOptions = computed<readonly CuotaFiltroOpcion[]>(() => {
    if (!this.filters().propiedad || this.unitLoading() || this.unitError()) {
      return [];
    }

    return [
      { value: '', label: 'Todas las unidades' },
      ...this.units().map((unit) => ({ value: String(unit.coduni), label: unit.nombre })),
    ];
  });

  protected readonly stateOptions: readonly CuotaFiltroOpcion[] = [
    { value: '', label: 'Todos' },
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'PARCIAL', label: 'Parcial' },
    { value: 'PAGADA', label: 'Pagada' },
    { value: 'ANULADA', label: 'Anulada' },
  ];

  protected readonly dueOptions: readonly CuotaFiltroOpcion[] = [
    { value: '', label: 'Todos' },
    { value: 'VENCIDAS', label: 'Vencidas' },
    { value: 'HOY', label: 'Vencen hoy' },
    { value: 'PROXIMAS', label: 'Próximas 7 días' },
    { value: 'AL_DIA', label: 'Al día' },
  ];

  constructor() {
    this.listRequests$
      .pipe(
        switchMap((preservePage) => this.loadCuotas(preservePage)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((page) => this.handlePageResult(page));

    this.unitRequests$
      .pipe(
        switchMap((codprop) => this.loadUnitsForProperty(codprop)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => this.handleUnitResult(result));

    this.reviewPaymentRequests$
      .pipe(
        switchMap((quotas) => this.reviewLookup.loadForQuotas(quotas)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((lookup) => {
        this.pendingReviewPayments.set(lookup.pagosPorCuota);
        this.pendingReviewLookupErrors.set(lookup.cuotasConError);
      });

    this.route.queryParamMap
      .pipe(
        map((params) => params.get('codcuo')),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((codcuo) => this.handleNotificationQuotaQuery(codcuo));

    this.loadTenantCatalog();
    this.loadPropertyCatalog();
  }

  protected setTenant(value: string): void {
    this.updateFilters({ inquilino: value });
  }

  protected setMonth(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateFilters({ periodoMes: this.isMonthValue(value) ? value : '' });
  }

  protected clearMonth(): void {
    this.updateFilters({ periodoMes: '' });
  }

  protected setState(value: string): void {
    this.updateFilters({ estado: value });
  }

  protected setDue(value: string): void {
    this.updateFilters({ vencimiento: value });
  }

  protected setProperty(value: string): void {
    const codprop = this.parseCatalogId(value);
    this.filters.update((filters) => ({
      ...filters,
      propiedad: codprop === null ? '' : String(codprop),
      unidad: '',
    }));
    this.units.set([]);
    this.unitError.set(null);
    this.unitLoading.set(codprop !== null);
    this.currentPage.set(0);
    this.unitRequests$.next(codprop);
    this.requestList();
  }

  protected setUnit(value: string): void {
    this.updateFilters({ unidad: value });
  }

  protected setReviewFilter(event: Event): void {
    this.updateFilters({
      pagoPendienteRevision: (event.target as HTMLInputElement).checked,
    });
  }

  protected toggleMoreFilters(): void {
    this.moreFiltersExpanded.update((expanded) => !expanded);
  }

  protected unitPlaceholder(): string {
    if (!this.filters().propiedad) {
      return 'Selecciona una propiedad';
    }

    if (this.unitLoading()) {
      return 'Cargando unidades…';
    }

    if (this.unitError()) {
      return 'No fue posible cargar unidades';
    }

    return 'Todas las unidades';
  }

  protected clearFilters(): void {
    this.filters.set(EMPTY_FILTERS);
    this.currentPage.set(0);
    this.units.set([]);
    this.unitError.set(null);
    this.unitLoading.set(false);
    this.unitRequests$.next(null);
    this.requestList();
  }

  protected changePage(page: number): void {
    const currentPage = this.page();

    if (page < 0 || currentPage === null || page >= currentPage.totalPages) {
      return;
    }

    this.currentPage.set(page);
    this.requestList();
  }

  protected openPaymentModal(quota: CuotaListado): void {
    this.selectedQuota.set(quota);
  }

  protected closePaymentModal(): void {
    this.selectedQuota.set(null);
  }

  protected openPaymentHistory(quota: CuotaListado): void {
    this.selectedHistoryQuota.set(quota);
  }

  protected closePaymentHistory(): void {
    this.selectedHistoryQuota.set(null);
  }

  protected openReviewPayment(selection: PagoRevisionSeleccion): void {
    this.selectedReviewPayment.set(selection);
  }

  protected closeReviewPayment(): void {
    this.selectedReviewPayment.set(null);
  }

  protected handlePaymentReviewed(payment: PagoResponse): void {
    this.selectedReviewPayment.set(null);
    this.notification.success(
      payment.estado === 'CONFIRMADO' ? 'Pago confirmado correctamente.' : 'Pago rechazado.',
    );
    this.requestList(true);
  }

  protected handleReviewRefreshRequested(): void {
    this.requestList(true);
  }

  protected handlePaymentAnnulled(): void {
    this.notification.success('Pago anulado correctamente.');
    this.requestList(true);
  }

  protected handlePaymentRegistered(): void {
    this.selectedQuota.set(null);
    this.notification.success('Pago registrado correctamente.');
    this.requestList(true);
  }

  private updateFilters(change: Partial<CuotaFiltrosUi>): void {
    this.filters.update((filters) => ({ ...filters, ...change }));
    this.currentPage.set(0);
    this.requestList();
  }

  private requestList(preservePage = false): void {
    this.pendingReviewPayments.set(new Map());
    this.pendingReviewLookupErrors.set(new Set());
    this.reviewPaymentRequests$.next([]);
    this.listRequests$.next(preservePage);
  }

  private loadCuotas(preservePage: boolean): Observable<PageResponse<CuotaListado>> {
    if (this.notificationQuotaRequested() && this.notificationCodcuo() === null) {
      this.loading.set(false);
      return EMPTY;
    }

    this.loading.set(true);
    this.error.set(null);

    if (!preservePage) {
      this.page.set(null);
    }

    return this.cuotaApi.list(this.toCriteria()).pipe(
      catchError((requestError: unknown) => {
        this.error.set(this.errorMessage(requestError, 'No fue posible cargar las cuotas.'));
        return EMPTY;
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  private toCriteria(): CuotaListadoFilters {
    const filters = this.filters();

    return {
      codcuo: this.notificationCodcuo(),
      codperInquilino: this.parseCatalogId(filters.inquilino),
      periodo: this.periodToApi(filters.periodoMes),
      estado: this.parseState(filters.estado),
      vencimiento: this.parseDue(filters.vencimiento),
      codprop: this.parseCatalogId(filters.propiedad),
      coduni: this.parseCatalogId(filters.unidad),
      conPagoPendienteRevision: filters.pagoPendienteRevision,
      page: this.currentPage(),
      size: PAGE_SIZE,
    };
  }

  private parseState(value: string): CuotaEstado | null {
    switch (value) {
      case 'PENDIENTE':
      case 'PARCIAL':
      case 'PAGADA':
      case 'ANULADA':
        return value;
      default:
        return null;
    }
  }

  private parseDue(value: string): CuotaVencimientoFiltro | null {
    switch (value) {
      case 'VENCIDAS':
      case 'HOY':
      case 'PROXIMAS':
      case 'AL_DIA':
        return value;
      default:
        return null;
    }
  }

  private parseCatalogId(value: string): number | null {
    if (!value) {
      return null;
    }

    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  }

  private periodToApi(month: string): string | null {
    if (!this.isMonthValue(month)) {
      return null;
    }

    return `${month}-01`;
  }

  private isMonthValue(value: string): boolean {
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
  }

  private handlePageResult(page: PageResponse<CuotaListado>): void {
    if (page.totalPages === 0 && this.currentPage() !== 0) {
      this.currentPage.set(0);
      this.requestList();
      return;
    }

    if (page.totalPages > 0 && this.currentPage() >= page.totalPages) {
      this.currentPage.set(page.totalPages - 1);
      this.requestList();
      return;
    }

    const codcuo = this.notificationCodcuo();

    if (codcuo === null) {
      this.notificationQuotaNotFound.set(false);
      this.page.set(page);
      this.reviewPaymentRequests$.next(page.content);
      return;
    }

    const quota = page.content.find((item) => item.codcuo === codcuo);

    if (!quota) {
      this.notificationQuotaNotFound.set(true);
      this.page.set({
        ...page,
        content: [],
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      });
      this.reviewPaymentRequests$.next([]);
      return;
    }

    this.notificationQuotaNotFound.set(false);
    this.page.set({
      ...page,
      content: [quota],
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    });
    this.reviewPaymentRequests$.next([quota]);
  }

  private handleNotificationQuotaQuery(codcuoValue: string | null): void {
    this.notificationQuotaRequested.set(codcuoValue !== null);
    this.notificationQuotaNotFound.set(false);
    this.notificationCodcuo.set(codcuoValue === null ? null : this.parseCatalogId(codcuoValue));

    if (codcuoValue !== null) {
      this.filters.set(EMPTY_FILTERS);
      this.units.set([]);
      this.unitError.set(null);
      this.unitLoading.set(false);
      this.unitRequests$.next(null);
      this.currentPage.set(0);
    }

    if (codcuoValue !== null && this.notificationCodcuo() === null) {
      this.page.set(null);
      this.error.set(null);
      this.loading.set(false);
      this.notificationQuotaNotFound.set(true);
      this.requestList();
      return;
    }

    this.requestList();
  }

  private loadTenantCatalog(): void {
    this.catalogApi
      .listInquilinos()
      .pipe(
        catchError((requestError: unknown) => {
          this.tenantError.set(
            this.errorMessage(requestError, 'No fue posible cargar los inquilinos.'),
          );
          return of([] as readonly InquilinoCuota[]);
        }),
        finalize(() => this.tenantLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((tenants) => this.tenants.set(tenants));
  }

  private loadPropertyCatalog(): void {
    this.catalogApi
      .listPropiedades()
      .pipe(
        catchError((requestError: unknown) => {
          this.propertyError.set(
            this.errorMessage(requestError, 'No fue posible cargar las propiedades.'),
          );
          return of([] as readonly Propiedad[]);
        }),
        finalize(() => this.propertyLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((properties) => this.properties.set(properties));
  }

  private loadUnitsForProperty(codprop: number | null): Observable<UnidadRequestResult> {
    if (codprop === null) {
      return of({ codprop: null, unidades: [], error: null });
    }

    this.unitError.set(null);

    return this.catalogApi.listUnidades(codprop).pipe(
      map((units) => ({ codprop, unidades: units, error: null })),
      catchError((requestError: unknown) =>
        of({
          codprop,
          unidades: [],
          error: this.errorMessage(requestError, 'No fue posible cargar las unidades.'),
        }),
      ),
    );
  }

  private handleUnitResult(result: UnidadRequestResult): void {
    const selectedProperty = this.parseCatalogId(this.filters().propiedad);

    if (result.codprop !== selectedProperty) {
      return;
    }

    this.units.set(result.unidades);
    this.unitError.set(result.error);
    this.unitLoading.set(false);
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && isProblemDetail(error.error) && error.error.detail) {
      return error.error.detail;
    }

    if (error instanceof HttpErrorResponse && error.status === 403) {
      return 'Acceso denegado.';
    }

    return fallback;
  }
}
