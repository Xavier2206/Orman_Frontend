import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  distinctUntilChanged,
  expand,
  finalize,
  map,
  of,
  reduce,
  switchMap,
} from 'rxjs';

import { isProblemDetail } from '../../../../core/api/problem-detail.model';
import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { PageResponse } from '../../../personas/models/persona.model';
import { Propiedad, PropiedadListFilters } from '../../../propiedades/models/propiedad.model';
import { PropiedadApiService } from '../../../propiedades/data/propiedad-api.service';
import { UnidadCardComponent } from '../../components/unidad-card/unidad-card.component';
import { UnidadStatusConfirmModalComponent } from '../../components/unidad-status-confirm-modal/unidad-status-confirm-modal.component';
import { UnidadApiService } from '../../data/unidad-api.service';
import { UnidadEstadoOperativo, UnidadResponse } from '../../models/unidad.model';
import {
  EMPTY_UNIDAD_LIST_CONTEXT,
  UnidadListContext,
  UnidadStatusFilter,
  parseUnidadListContext,
  serializeUnidadListContext,
} from '../../utils/unidad-list-context';

interface UnitListRequest {
  readonly codprop: number;
  readonly page: number;
  readonly estadoOperativo: UnidadEstadoOperativo | null;
}

interface UnidadStatusOption {
  readonly value: UnidadStatusFilter;
  readonly label: string;
}

type PropertyLoadResult =
  | { readonly properties: readonly Propiedad[]; readonly error: null }
  | { readonly properties: null; readonly error: string };

type UnitListResult =
  | {
      readonly codprop: number;
      readonly page: PageResponse<UnidadResponse>;
      readonly error: null;
    }
  | { readonly codprop: number; readonly page: null; readonly error: string };

@Component({
  selector: 'app-unidades-list',
  imports: [MatIconModule, UnidadCardComponent, UnidadStatusConfirmModalComponent],
  templateUrl: './unidades-list.component.html',
  styleUrl: './unidades-list.component.css',
})
export class UnidadesListComponent {
  private readonly propiedadApi = inject(PropiedadApiService);
  private readonly unidadApi = inject(UnidadApiService);
  private readonly notification = inject(OrmanNotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly propertyRequests$ = new Subject<void>();
  private readonly unitRequests$ = new Subject<UnitListRequest>();
  private readonly propertyPageSize = 100;
  private readonly unitPageSize = 20;
  private readonly sort = 'nombre,asc';
  private propertiesReady = false;
  private routeContext: UnidadListContext = EMPTY_UNIDAD_LIST_CONTEXT;

  protected readonly properties = signal<readonly Propiedad[]>([]);
  protected readonly selectedPropertyId = signal<number | null>(null);
  protected readonly selectedStatusFilter = signal<UnidadStatusFilter>('all');
  protected readonly selectedProperty = computed(() => {
    const selectedId = this.selectedPropertyId();

    return this.properties().find((property) => property.codprop === selectedId) ?? null;
  });
  protected readonly hasActiveFilters = computed(
    () => this.selectedPropertyId() !== null || this.selectedStatusFilter() !== 'all',
  );
  protected readonly propertyLoading = signal(true);
  protected readonly propertyError = signal<string | null>(null);
  protected readonly unitPage = signal<PageResponse<UnidadResponse> | null>(null);
  protected readonly unitLoading = signal(false);
  protected readonly unitError = signal<string | null>(null);
  protected readonly currentUnitPage = signal(0);
  protected readonly statusModalUnit = signal<UnidadResponse | null>(null);
  protected readonly statusModalOperation = signal<'activate' | 'deactivate' | null>(null);
  protected readonly statusActionCoduni = signal<number | null>(null);
  protected readonly statusFeedback = signal<string | null>(null);
  protected readonly loadingCards = [0, 1, 2, 3, 4, 5];
  protected readonly statusOptions: readonly UnidadStatusOption[] = [
    { value: 'all', label: 'Todas las unidades' },
    { value: 'operational', label: 'Operativas' },
    { value: 'non-operational', label: 'No operativas' },
  ];

  constructor() {
    this.route.queryParamMap
      .pipe(
        map((params) => parseUnidadListContext(params)),
        distinctUntilChanged((previous, current) => this.sameContext(previous, current)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((context) => {
        this.routeContext = context;

        if (this.propertiesReady) {
          this.applyRouteContext(context);
        }
      });

    this.propertyRequests$
      .pipe(
        switchMap(() =>
          this.loadAllProperties().pipe(
            map((properties): PropertyLoadResult => ({
              properties,
              error: null,
            })),
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
        switchMap(({ codprop, page, estadoOperativo }) =>
          this.unidadApi
            .listByProperty(codprop, page, this.unitPageSize, this.sort, estadoOperativo)
            .pipe(
              map((unitPage): UnitListResult => ({
                codprop,
                page: unitPage,
                error: null,
              })),
              catchError((requestError: unknown) =>
                of<UnitListResult>({
                  codprop,
                  page: null,
                  error: this.errorMessage(requestError, 'No pudimos cargar las unidades.'),
                }),
              ),
            ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => this.handleUnitResult(result));

    this.loadProperties();
  }

  protected selectProperty(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    const codprop = Number(selectedValue);
    const selectedPropertyId = Number.isInteger(codprop) && codprop > 0 ? codprop : null;

    this.navigateToListContext({
      codprop: selectedPropertyId,
      statusFilter: selectedPropertyId === null ? 'all' : this.selectedStatusFilter(),
      page: 0,
    });
  }

  protected selectStatus(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    const statusFilter = this.statusOptions.some((option) => option.value === selectedValue)
      ? (selectedValue as UnidadStatusFilter)
      : 'all';

    this.navigateToListContext({
      codprop: this.selectedPropertyId(),
      statusFilter: this.selectedPropertyId() === null ? 'all' : statusFilter,
      page: 0,
    });
  }

  protected clearStatusFilter(): void {
    this.navigateToListContext({
      codprop: this.selectedPropertyId(),
      statusFilter: 'all',
      page: 0,
    });
  }

  protected clearFilters(): void {
    this.navigateToListContext(EMPTY_UNIDAD_LIST_CONTEXT);
  }

  protected statusFilterLabel(): string {
    return (
      this.statusOptions.find((option) => option.value === this.selectedStatusFilter())?.label ??
      this.statusOptions[0].label
    );
  }

  protected emptyUnitsTitle(): string {
    if (this.selectedStatusFilter() === 'operational') {
      return 'No hay unidades operativas para esta propiedad.';
    }

    if (this.selectedStatusFilter() === 'non-operational') {
      return 'No hay unidades no operativas para esta propiedad.';
    }

    return 'Esta propiedad todavía no tiene unidades registradas.';
  }

  protected emptyUnitsDescription(): string {
    if (this.selectedStatusFilter() === 'all') {
      return 'Cuando registres unidades para esta propiedad aparecerán aquí.';
    }

    return 'Prueba con otro estado operativo o muestra todas las unidades de esta propiedad.';
  }

  protected retryProperties(): void {
    this.loadProperties();
  }

  protected retryUnits(): void {
    if (this.selectedPropertyId() === null) {
      return;
    }

    this.loadUnits(this.currentUnitPage());
  }

  protected createUnit(): void {
    this.navigateToDestination(['/app/unidades/nueva']);
  }

  protected editUnit(unit: UnidadResponse): void {
    this.navigateToDestination(['/app/unidades', unit.coduni, 'editar']);
  }

  protected detailUnit(unit: UnidadResponse): void {
    this.navigateToDestination(['/app/unidades', unit.coduni, 'detalle']);
  }

  protected openStatusModal(unit: UnidadResponse, operation: 'activate' | 'deactivate'): void {
    if (this.statusActionCoduni() !== null) {
      return;
    }

    this.statusModalUnit.set(unit);
    this.statusModalOperation.set(operation);
    this.statusFeedback.set(null);
  }

  protected closeStatusModal(): void {
    if (this.statusActionCoduni() !== null) {
      return;
    }

    this.clearStatusModal();
  }

  protected submitStatus(): void {
    const unit = this.statusModalUnit();
    const operation = this.statusModalOperation();

    if (!unit || !operation || this.statusActionCoduni() !== null) {
      return;
    }

    this.statusActionCoduni.set(unit.coduni);
    this.statusFeedback.set(null);
    const request$ =
      operation === 'deactivate'
        ? this.unidadApi.desactivarUnidad(unit.coduni)
        : this.unidadApi.activarUnidad(unit.coduni);

    request$
      .pipe(
        finalize(() => this.statusActionCoduni.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updatedUnit) => {
          this.updateUnitInCurrentPage(updatedUnit);
          this.clearStatusModal();
          this.notification.success(
            operation === 'deactivate'
              ? 'Unidad desactivada correctamente.'
              : 'Unidad activada correctamente.',
          );
          this.loadUnits(this.currentUnitPage(), false);
        },
        error: (requestError: unknown) => {
          this.statusFeedback.set(
            this.errorMessage(requestError, 'No fue posible actualizar el estado de la unidad.'),
          );
        },
      });
  }

  protected changePage(page: number): void {
    const currentPage = this.unitPage();

    if (!currentPage || page < 0 || page >= currentPage.totalPages || page === currentPage.page) {
      return;
    }

    this.navigateToListContext({
      codprop: this.selectedPropertyId(),
      statusFilter: this.selectedStatusFilter(),
      page,
    });
  }

  private loadProperties(): void {
    this.propertyLoading.set(true);
    this.propertyError.set(null);
    this.propertyRequests$.next();
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
    const filters: PropiedadListFilters = {
      q: '',
      tipo: null,
      estado: null,
      page,
      size: this.propertyPageSize,
      sort: this.sort,
    };

    return this.propiedadApi.list(filters);
  }

  private loadUnits(page: number, showLoading = true): void {
    const codprop = this.selectedPropertyId();

    if (codprop === null) {
      return;
    }

    this.currentUnitPage.set(page);
    this.unitLoading.set(showLoading);
    this.unitError.set(null);
    this.unitRequests$.next({
      codprop,
      page,
      estadoOperativo: this.backendStatusFilter(),
    });
  }

  private backendStatusFilter(): UnidadEstadoOperativo | null {
    if (this.selectedStatusFilter() === 'operational') {
      return 1;
    }

    if (this.selectedStatusFilter() === 'non-operational') {
      return 0;
    }

    return null;
  }

  private handlePropertyResult(result: PropertyLoadResult): void {
    this.propertyLoading.set(false);

    if (result.properties === null) {
      this.properties.set([]);
      this.propertyError.set(result.error);
      return;
    }

    this.properties.set(result.properties);
    this.propertiesReady = true;
    this.applyRouteContext(this.routeContext);
  }

  private handleUnitResult(result: UnitListResult): void {
    if (result.codprop !== this.selectedPropertyId()) {
      return;
    }

    this.unitLoading.set(false);

    if (result.page === null) {
      this.unitPage.set(null);
      this.unitError.set(result.error);
      return;
    }

    if (result.page.totalPages > 0 && result.page.page >= result.page.totalPages) {
      this.navigateToListContext({
        codprop: this.selectedPropertyId(),
        statusFilter: this.selectedStatusFilter(),
        page: result.page.totalPages - 1,
      });
      return;
    }

    this.currentUnitPage.set(result.page.page);
    this.unitPage.set(result.page);
  }

  private updateUnitInCurrentPage(updatedUnit: UnidadResponse): void {
    const currentPage = this.unitPage();

    if (!currentPage) {
      return;
    }

    this.unitPage.set({
      ...currentPage,
      content: currentPage.content.map((unit) =>
        unit.coduni === updatedUnit.coduni ? updatedUnit : unit,
      ),
    });
  }

  private clearStatusModal(): void {
    this.statusModalUnit.set(null);
    this.statusModalOperation.set(null);
    this.statusFeedback.set(null);
  }

  private applyRouteContext(context: UnidadListContext): void {
    const selectedPropertyId = this.findPropertyId(context.codprop);
    const statusFilter = selectedPropertyId === null ? 'all' : context.statusFilter;
    const propertyChanged = this.selectedPropertyId() !== selectedPropertyId;
    const statusChanged = this.selectedStatusFilter() !== statusFilter;
    const pageChanged = this.currentUnitPage() !== context.page;

    this.selectedPropertyId.set(selectedPropertyId);
    this.selectedStatusFilter.set(statusFilter);

    if (selectedPropertyId === null) {
      this.unitPage.set(null);
      this.unitError.set(null);
      this.currentUnitPage.set(0);
      this.unitLoading.set(false);
      return;
    }

    const alreadyLoadingRequestedContext =
      !propertyChanged && !statusChanged && !pageChanged && this.unitLoading();
    const alreadyLoadedContext =
      !propertyChanged && !statusChanged && !pageChanged && this.unitPage()?.page === context.page;

    if (alreadyLoadingRequestedContext || alreadyLoadedContext) {
      return;
    }

    this.unitPage.set(null);
    this.unitError.set(null);
    this.loadUnits(context.page);
  }

  private navigateToListContext(context: UnidadListContext): void {
    this.applyRouteContext(context);

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: serializeUnidadListContext(context),
      replaceUrl: true,
    });
  }

  private currentListContext(): UnidadListContext {
    return {
      codprop: this.selectedPropertyId(),
      statusFilter: this.selectedStatusFilter(),
      page: this.currentUnitPage(),
    };
  }

  private navigateToDestination(commands: readonly unknown[]): void {
    const extras = this.destinationExtras(this.currentListContext());

    if (extras === null) {
      void this.router.navigate(commands);
      return;
    }

    void this.router.navigate(commands, extras);
  }

  private destinationExtras(context: UnidadListContext): NavigationExtras | null {
    const queryParams = serializeUnidadListContext(context);
    const hasContext = Object.keys(queryParams).length > 0;

    return hasContext ? { queryParams } : null;
  }

  private findPropertyId(codprop: number | null): number | null {
    if (codprop === null) {
      return null;
    }

    return this.properties().some((property) => property.codprop === codprop) ? codprop : null;
  }

  private sameContext(previous: UnidadListContext, current: UnidadListContext): boolean {
    return (
      previous.codprop === current.codprop &&
      previous.statusFilter === current.statusFilter &&
      previous.page === current.page
    );
  }

  private errorMessage(requestError: unknown, fallback: string): string {
    const problem =
      requestError instanceof HttpErrorResponse && isProblemDetail(requestError.error)
        ? requestError.error
        : null;

    if (problem?.detail) {
      return problem.detail;
    }

    if (requestError instanceof HttpErrorResponse) {
      if (requestError.status === 401) {
        return 'Tu sesión ya no es válida.';
      }

      if (requestError.status === 403) {
        return 'Acceso denegado.';
      }

      if (requestError.status === 404) {
        return 'No se encontró el recurso solicitado.';
      }
    }

    return fallback;
  }
}
