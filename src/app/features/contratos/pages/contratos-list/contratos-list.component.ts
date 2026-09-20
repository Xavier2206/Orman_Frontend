import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  expand,
  finalize,
  map,
  of,
  reduce,
  switchMap,
} from 'rxjs';

import { isProblemDetail } from '../../../../core/api/problem-detail.model';
import { PropiedadApiService } from '../../../propiedades/data/propiedad-api.service';
import { Propiedad } from '../../../propiedades/models/propiedad.model';
import { PageResponse } from '../../../personas/models/persona.model';
import { UnidadApiService } from '../../../unidades/data/unidad-api.service';
import { UnidadResponse } from '../../../unidades/models/unidad.model';
import { ContratosResumenComponent } from '../../components/contratos-resumen/contratos-resumen.component';
import { ContratoFinalizeModalComponent } from '../../components/contrato-finalize-modal/contrato-finalize-modal.component';
import { ContratoRescindModalComponent } from '../../components/contrato-rescind-modal/contrato-rescind-modal.component';
import { ContratoApiService } from '../../data/contrato-api.service';
import { CuotaApiService } from '../../data/cuota-api.service';
import {
  Contrato,
  ContratoEstado,
  ContratoListFilters,
  ContratoRescindRequest,
  ContratoResumen,
  CuotaResponse,
} from '../../models/contrato.model';

interface FilterOption {
  readonly value: string;
  readonly label: string;
}

type FilterMenu = 'status' | 'property' | 'unit';
type CatalogFilter = 'property' | 'unit';
type ActionModal = 'rescind' | 'finalize' | null;

interface PropertyLoadResult {
  readonly properties: readonly Propiedad[] | null;
  readonly error: string | null;
}

interface UnitLoadRequest {
  readonly codprop: number;
}

interface UnitLoadResult {
  readonly codprop: number;
  readonly units: readonly UnidadResponse[] | null;
  readonly error: string | null;
}

type ListResult =
  | { readonly page: PageResponse<Contrato>; readonly error: null }
  | { readonly page: null; readonly error: string };

@Component({
  selector: 'app-contratos-list',
  imports: [
    MatIconModule,
    RouterLink,
    ContratosResumenComponent,
    ContratoFinalizeModalComponent,
    ContratoRescindModalComponent,
  ],
  templateUrl: './contratos-list.component.html',
  styleUrl: './contratos-list.component.css',
})
export class ContratosListComponent {
  private readonly api = inject(ContratoApiService);
  private readonly propiedadApi = inject(PropiedadApiService);
  private readonly unidadApi = inject(UnidadApiService);
  private readonly cuotaApi = inject(CuotaApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly search$ = new Subject<string>();
  private readonly requests$ = new Subject<ContratoListFilters>();
  private readonly propertyRequests$ = new Subject<void>();
  private readonly unitRequests$ = new Subject<UnitLoadRequest>();
  private readonly pageSize = 20;
  private readonly catalogPageSize = 100;
  private readonly contractSort = 'fechaInicio,desc';
  private readonly catalogSort = 'nombre,asc';
  private actionLoadToken = 0;

  protected readonly page = signal<PageResponse<Contrato> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly resumen = signal<ContratoResumen>({
    vigentes: 0,
    programados: 0,
    finalizados: 0,
    rescindidos: 0,
  });
  protected readonly resumenLoading = signal(true);
  protected readonly resumenError = signal<string | null>(null);
  protected readonly properties = signal<readonly Propiedad[]>([]);
  protected readonly propertyLoading = signal(true);
  protected readonly propertyError = signal<string | null>(null);
  protected readonly units = signal<readonly UnidadResponse[]>([]);
  protected readonly unitLoading = signal(false);
  protected readonly unitError = signal<string | null>(null);
  protected readonly actionModal = signal<ActionModal>(null);
  protected readonly actionContract = signal<Contrato | null>(null);
  protected readonly actionInstallments = signal<readonly CuotaResponse[]>([]);
  protected readonly actionInstallmentsLoading = signal(false);
  protected readonly actionInstallmentsError = signal<string | null>(null);
  protected readonly actionSubmitting = signal(false);
  protected readonly actionFeedback = signal<string | null>(null);
  protected readonly openFilter = signal<FilterMenu | null>(null);
  protected readonly filters = signal<ContratoListFilters>({
    q: '',
    codprop: null,
    coduni: null,
    estado: null,
    page: 0,
    size: this.pageSize,
    sort: this.contractSort,
  });
  protected readonly stateOptions: readonly FilterOption[] = [
    { value: '', label: 'Todos' },
    { value: 'VIGENTE', label: 'Vigente' },
    { value: 'PROGRAMADO', label: 'Programado' },
    { value: 'FINALIZADO', label: 'Finalizado' },
    { value: 'RESCINDIDO', label: 'Rescindido' },
  ];
  constructor() {
    this.search$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((q) => this.load({ q, page: 0 }));

    this.requests$
      .pipe(
        switchMap((filters) =>
          this.api.list(filters).pipe(
            map((page): ListResult => ({ page, error: null })),
            catchError((requestError: unknown) =>
              of<ListResult>({ page: null, error: this.errorMessage(requestError) }),
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => this.handleListResult(result));

    this.propertyRequests$
      .pipe(
        switchMap(() =>
          this.loadAllProperties().pipe(
            map((properties): PropertyLoadResult => ({ properties, error: null })),
            catchError((requestError: unknown) =>
              of<PropertyLoadResult>({
                properties: null,
                error: this.errorMessage(requestError, 'No fue posible cargar las propiedades.'),
              }),
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => this.handlePropertyResult(result));

    this.unitRequests$
      .pipe(
        switchMap(({ codprop }) =>
          this.loadAllUnits(codprop).pipe(
            map((units): UnitLoadResult => ({ codprop, units, error: null })),
            catchError((requestError: unknown) =>
              of<UnitLoadResult>({
                codprop,
                units: null,
                error: this.errorMessage(requestError, 'No fue posible cargar las unidades.'),
              }),
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => this.handleUnitResult(result));

    this.load();
    this.loadResumen();
    this.loadProperties();
  }

  protected search(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value);
  }

  protected selectProperty(value: string): void {
    const codprop = this.parseCatalogId(value, this.properties(), 'codprop');

    this.applyPropertyFilter(codprop);
    this.closeFilter(true, 'property');
  }

  private applyPropertyFilter(codprop: number | null): void {

    if (codprop === this.filters().codprop) {
      return;
    }

    this.units.set([]);
    this.unitError.set(null);
    this.unitLoading.set(codprop !== null);
    this.page.set(null);
    this.load({ codprop, coduni: null, page: 0 });

    if (codprop !== null) {
      this.unitRequests$.next({ codprop });
    }
  }

  protected selectUnit(value: string): void {
    const coduni = this.parseCatalogId(value, this.units(), 'coduni');

    this.load({ coduni, page: 0 });
    this.closeFilter(true, 'unit');
  }

  protected propertyFilterDisabled(): boolean {
    return this.propertyLoading() || this.propertyError() !== null || this.properties().length === 0;
  }

  protected unitFilterDisabled(): boolean {
    return (
      this.filters().codprop === null ||
      this.unitLoading() ||
      this.unitError() !== null ||
      this.units().length === 0
    );
  }

  protected selectedPropertyLabel(): string {
    const selectedProperty = this.properties().find(
      (property) => property.codprop === this.filters().codprop,
    );

    if (selectedProperty) {
      return `${selectedProperty.nombre} (#${selectedProperty.codprop})`;
    }

    return this.propertyLoading() ? 'Cargando propiedades...' : 'Seleccione una propiedad';
  }

  protected selectedUnitLabel(): string {
    const selectedUnit = this.units().find((unit) => unit.coduni === this.filters().coduni);

    if (selectedUnit) {
      return `${selectedUnit.nombre} (#${selectedUnit.coduni})`;
    }

    if (this.unitLoading()) {
      return 'Cargando unidades...';
    }

    return this.filters().codprop === null
      ? 'Seleccione una propiedad primero'
      : 'Seleccione una unidad';
  }

  protected setState(value: string): void {
    const estado = this.isContractState(value) ? value : null;

    this.load({ estado, page: 0 });
  }

  protected selectedFilterLabel(): string {
    return (
      this.stateOptions.find((option) => option.value === this.selectedFilterValue())?.label ??
      'Todos'
    );
  }

  protected selectedFilterValue(): string {
    return this.filters().estado ?? '';
  }

  protected toggleFilter(): void {
    if (this.openFilter() === 'status') {
      this.closeFilter();
      return;
    }

    this.openFilter.set('status');
    this.focusFilterOption(this.selectedFilterIndex());
  }

  protected selectFilter(value: string): void {
    this.setState(value);
    this.closeFilter(true);
  }

  protected handleFilterTriggerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }

    event.preventDefault();
    this.openFilter.set('status');
    this.focusFilterOption(this.selectedFilterIndex());
  }

  protected handleFilterOptionKeydown(event: KeyboardEvent, index: number): void {
    const options = this.stateOptions;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeFilter(true);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectFilter(options[index].value);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const offset = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = (index + offset + options.length) % options.length;
      this.focusFilterOption(nextIndex);
    }
  }

  protected toggleCatalogFilter(filter: CatalogFilter): void {
    if (this.catalogFilterDisabled(filter)) {
      return;
    }

    if (this.openFilter() === filter) {
      this.closeFilter();
      return;
    }

    this.openFilter.set(filter);
    this.focusFilterOption(this.selectedCatalogIndex(filter), filter);
  }

  protected handleCatalogFilterTriggerKeydown(
    event: KeyboardEvent,
    filter: CatalogFilter,
  ): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }

    event.preventDefault();
    this.openFilter.set(filter);
    this.focusFilterOption(this.selectedCatalogIndex(filter), filter);
  }

  protected handleCatalogFilterOptionKeydown(
    event: KeyboardEvent,
    filter: CatalogFilter,
    value: string,
    index: number,
  ): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeFilter(true, filter);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();

      if (filter === 'property') {
        this.selectProperty(value);
      } else {
        this.selectUnit(value);
      }

      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const offset = event.key === 'ArrowDown' ? 1 : -1;
      const optionCount = this.catalogOptionCount(filter);
      const nextIndex = (index + offset + optionCount) % optionCount;
      this.focusFilterOption(nextIndex, filter);
    }
  }

  @HostListener('document:click', ['$event'])
  protected closeFilterOnOutsideClick(event: MouseEvent): void {
    const target = event.target;

    if (this.openFilter() && target instanceof Node && !this.host.nativeElement.contains(target)) {
      this.closeFilter();
    }
  }

  protected retryProperties(): void {
    this.loadProperties();
  }

  protected retryUnits(): void {
    const codprop = this.filters().codprop;

    if (codprop === null) {
      return;
    }

    this.units.set([]);
    this.unitError.set(null);
    this.unitLoading.set(true);
    this.unitRequests$.next({ codprop });
  }

  protected clearFilters(): void {
    this.units.set([]);
    this.unitError.set(null);
    this.unitLoading.set(false);
    this.page.set(null);
    this.load({ q: '', codprop: null, coduni: null, estado: null, page: 0 });
  }

  protected hasFilters(): boolean {
    const filters = this.filters();

    return (
      filters.q.trim().length > 0 ||
      filters.codprop !== null ||
      filters.coduni !== null ||
      filters.estado !== null
    );
  }

  protected retry(): void {
    this.load();
  }

  protected openRescindModal(contract: Contrato): void {
    this.openActionModal('rescind', contract);
  }

  protected openFinalizeModal(contract: Contrato): void {
    this.openActionModal('finalize', contract);
  }

  protected closeActionModal(): void {
    if (this.actionSubmitting()) {
      return;
    }

    this.actionModal.set(null);
    this.actionContract.set(null);
    this.actionInstallments.set([]);
    this.actionInstallmentsLoading.set(false);
    this.actionInstallmentsError.set(null);
    this.actionFeedback.set(null);
  }

  protected confirmRescind(request: ContratoRescindRequest): void {
    const contract = this.actionContract();

    if (!contract || this.actionSubmitting()) {
      return;
    }

    this.submitContractAction(() => this.api.rescind(contract.codcon, request));
  }

  protected confirmFinalize(): void {
    const contract = this.actionContract();

    if (!contract || this.actionSubmitting()) {
      return;
    }

    this.submitContractAction(() => this.api.finalizeContract(contract.codcon));
  }

  protected changePage(page: number): void {
    const currentPage = this.page();

    if (!currentPage || page < 0 || page >= currentPage.totalPages || page === currentPage.page) {
      return;
    }

    this.load({ page });
  }

  protected stateLabel(state: ContratoEstado): string {
    return this.stateOptions.find((option) => option.value === state)?.label ?? state;
  }

  protected stateClass(state: ContratoEstado): string {
    return `contract-status-${state.toLowerCase()}`;
  }

  protected tenantName(contrato: Contrato): string {
    return contrato.inquilino?.nombreCompleto ?? `Inquilino #${contrato.codperInquilino}`;
  }

  protected tenantInitials(contrato: Contrato): string {
    const fullName = contrato.inquilino?.nombreCompleto?.trim();

    if (!fullName) {
      return 'IN';
    }

    const parts = fullName.split(/\s+/);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  protected tenantCi(contrato: Contrato): string | null {
    return contrato.inquilino?.ci ?? null;
  }

  protected getPropiedadNombre(contrato: Contrato): string {
    return contrato.propiedad?.nombre ?? 'Propiedad no disponible';
  }

  protected getUnidadNombre(contrato: Contrato): string {
    return contrato.unidad?.nombre ?? `Unidad #${contrato.coduni}`;
  }

  protected getUnitMeta(contrato: Contrato): string | null {
    const unit = contrato.unidad;

    if (!unit) {
      return null;
    }

    const metadata: string[] = [];

    if (unit.piso !== null) {
      metadata.push(`Piso ${unit.piso}`);
    }

    if (unit.tipoUnidad.trim()) {
      metadata.push(unit.tipoUnidad);
    }

    return metadata.length > 0 ? metadata.join(' · ') : null;
  }

  protected contractDurationMonths(contrato: Contrato): number | null {
    const start = this.monthIndex(contrato.fechaInicio);
    const end = this.monthIndex(contrato.fechaFin);

    if (start === null || end === null || end <= start) {
      return null;
    }

    return end - start;
  }

  protected formatDate(value: string | null): string {
    if (!value) {
      return 'No definida';
    }

    const [year, month, day] = value.slice(0, 10).split('-');

    return year && month && day ? `${day}/${month}/${year}` : value;
  }

  protected formatMoney(value: number, currency: string): string {
    return `Bs ${value.toLocaleString('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  private load(change: Partial<ContratoListFilters> = {}): void {
    const filters = { ...this.filters(), ...change };

    this.filters.set(filters);
    this.loading.set(true);
    this.error.set(null);
    this.requests$.next(filters);
  }

  private openActionModal(type: Exclude<ActionModal, null>, contract: Contrato): void {
    this.actionModal.set(type);
    this.actionContract.set(contract);
    this.actionInstallments.set([]);
    this.actionInstallmentsLoading.set(true);
    this.actionInstallmentsError.set(null);
    this.actionSubmitting.set(false);
    this.actionFeedback.set(null);
    this.loadActionInstallments(contract.codcon);
  }

  private loadActionInstallments(codcon: number): void {
    const loadToken = ++this.actionLoadToken;

    this.cuotaApi
      .listByContract(codcon)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (loadToken === this.actionLoadToken) {
            this.actionInstallmentsLoading.set(false);
          }
        }),
      )
      .subscribe({
        next: (installments) => {
          if (loadToken === this.actionLoadToken) {
            this.actionInstallments.set(installments);
          }
        },
        error: (requestError: unknown) => {
          if (loadToken === this.actionLoadToken) {
            this.actionInstallmentsError.set(
              this.errorMessage(requestError, 'No fue posible cargar las cuotas del contrato.'),
            );
          }
        },
      });
  }

  private submitContractAction(action: () => Observable<Contrato>): void {
    this.actionSubmitting.set(true);
    this.actionFeedback.set(null);

    action()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.actionSubmitting.set(false)),
      )
      .subscribe({
        next: () => {
          const propertyCode = this.filters().codprop;

          this.actionSubmitting.set(false);
          this.closeActionModal();
          this.load();
          this.loadResumen();

          if (propertyCode !== null) {
            this.retryUnits();
          }
        },
        error: (requestError: unknown) => {
          this.actionFeedback.set(
            this.errorMessage(requestError, 'No fue posible actualizar el contrato.'),
          );
        },
      });
  }

  private loadProperties(): void {
    this.propertyLoading.set(true);
    this.propertyError.set(null);
    this.propertyRequests$.next();
  }

  private loadResumen(): void {
    this.resumenLoading.set(true);
    this.resumenError.set(null);

    this.api
      .resumen()
      .pipe(
        finalize(() => this.resumenLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (resumen) => this.resumen.set(resumen),
        error: (requestError: unknown) => {
          this.resumenError.set(
            this.errorMessage(requestError, 'No fue posible cargar el resumen de contratos.'),
          );
        },
      });
  }

  private loadAllProperties(): Observable<readonly Propiedad[]> {
    return this.loadPropertyPage(0).pipe(
      expand((page) => {
        const nextPage = page.page + 1;

        return nextPage < page.totalPages ? this.loadPropertyPage(nextPage) : EMPTY;
      }),
      reduce((properties, page) => [...properties, ...page.content], [] as Propiedad[]),
    );
  }

  private loadPropertyPage(page: number): Observable<PageResponse<Propiedad>> {
    return this.propiedadApi.list({
      q: '',
      tipo: null,
      estado: null,
      page,
      size: this.catalogPageSize,
      sort: this.catalogSort,
    });
  }

  private loadAllUnits(codprop: number): Observable<readonly UnidadResponse[]> {
    return this.loadUnitPage(codprop, 0).pipe(
      expand((page) => {
        const nextPage = page.page + 1;

        return nextPage < page.totalPages ? this.loadUnitPage(codprop, nextPage) : EMPTY;
      }),
      reduce((units, page) => [...units, ...page.content], [] as UnidadResponse[]),
    );
  }

  private loadUnitPage(codprop: number, page: number): Observable<PageResponse<UnidadResponse>> {
    return this.unidadApi.listByProperty(codprop, page, this.catalogPageSize, this.catalogSort);
  }

  private handleListResult(result: ListResult): void {
    this.loading.set(false);

    if (result.page === null) {
      this.page.set(null);
      this.error.set(result.error);
      return;
    }

    if (result.page.totalPages > 0 && result.page.page >= result.page.totalPages) {
      this.load({ page: result.page.totalPages - 1 });
      return;
    }

    this.page.set(result.page);
  }

  private handlePropertyResult(result: PropertyLoadResult): void {
    this.propertyLoading.set(false);

    if (result.properties === null) {
      this.properties.set([]);
      this.propertyError.set(result.error);
      return;
    }

    this.properties.set(result.properties);
  }

  private handleUnitResult(result: UnitLoadResult): void {
    if (result.codprop !== this.filters().codprop) {
      return;
    }

    this.unitLoading.set(false);

    if (result.units === null) {
      this.units.set([]);
      this.unitError.set(result.error);
      return;
    }

    this.unitError.set(null);
    this.units.set(result.units);
  }

  private selectedFilterIndex(): number {
    return Math.max(
      this.stateOptions.findIndex((option) => option.value === this.selectedFilterValue()),
      0,
    );
  }

  private closeFilter(restoreFocus = false, filter: FilterMenu | null = this.openFilter()): void {
    this.openFilter.set(null);

    if (restoreFocus && filter) {
      queueMicrotask(() => {
        this.host.nativeElement
          .querySelector<HTMLButtonElement>(`#contract-${filter}-trigger`)
          ?.focus();
      });
    }
  }

  private focusFilterOption(index: number, filter: FilterMenu = 'status'): void {
    queueMicrotask(() => {
      this.host.nativeElement
        .querySelector<HTMLElement>(`[data-filter="${filter}"][data-index="${index}"]`)
        ?.focus();
    });
  }

  private selectedCatalogIndex(filter: CatalogFilter): number {
    if (filter === 'property') {
      const selectedIndex = this.properties().findIndex(
        (property) => property.codprop === this.filters().codprop,
      );

      return selectedIndex < 0 ? 0 : selectedIndex + 1;
    }

    const selectedIndex = this.units().findIndex(
      (unit) => unit.coduni === this.filters().coduni,
    );

    return selectedIndex < 0 ? 0 : selectedIndex + 1;
  }

  private catalogOptionCount(filter: CatalogFilter): number {
    return filter === 'property' ? this.properties().length + 1 : this.units().length + 1;
  }

  private catalogFilterDisabled(filter: CatalogFilter): boolean {
    return filter === 'property' ? this.propertyFilterDisabled() : this.unitFilterDisabled();
  }

  private parseCatalogId(
    value: string,
    items: readonly { readonly codprop?: number; readonly coduni?: number }[],
    key: 'codprop' | 'coduni',
  ): number | null {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      return null;
    }

    return items.some((item) => item[key] === parsed) ? parsed : null;
  }

  private isContractState(value: string): value is ContratoEstado {
    return ['PROGRAMADO', 'VIGENTE', 'FINALIZADO', 'RESCINDIDO'].includes(value);
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

  private errorMessage(
    requestError: unknown,
    fallback = 'No fue posible cargar los contratos.',
  ): string {
    const problem =
      requestError instanceof HttpErrorResponse && isProblemDetail(requestError.error)
        ? requestError.error
        : null;

    return (
      problem?.detail ??
      (requestError instanceof HttpErrorResponse && requestError.status === 403
        ? 'Acceso denegado.'
        : fallback)
    );
  }
}
