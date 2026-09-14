import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  switchMap,
} from 'rxjs';

import { isProblemDetail } from '../../../../core/api/problem-detail.model';
import { PropiedadCardComponent } from '../../components/propiedad-card/propiedad-card.component';
import {
  PropiedadStatusConfirmModalComponent,
  PropiedadStatusOperation,
} from '../../components/propiedad-status-confirm-modal/propiedad-status-confirm-modal.component';
import { PropiedadesResumenComponent } from '../../components/propiedades-resumen/propiedades-resumen.component';
import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { PropiedadApiService } from '../../data/propiedad-api.service';
import { PageResponse } from '../../../personas/models/persona.model';
import {
  Propiedad,
  PropiedadEstado,
  PropiedadListFilters,
  PropiedadTipo,
} from '../../models/propiedad.model';
import { PropiedadResumen } from '../../models/propiedad-resumen.model';

type FilterMenu = 'type' | 'status';
type ModalMode = 'status' | null;

interface FilterOption {
  readonly label: string;
  readonly value: string;
}

interface SearchInput {
  readonly query: string;
  readonly revision: number;
}

type ListResult =
  | { readonly page: PageResponse<Propiedad>; readonly error: null }
  | { readonly page: null; readonly error: string };

@Component({
  selector: 'app-propiedades-list',
  imports: [
    MatIconModule,
    PropiedadCardComponent,
    PropiedadStatusConfirmModalComponent,
    PropiedadesResumenComponent,
  ],
  templateUrl: './propiedades-list.component.html',
  styleUrl: './propiedades-list.component.css',
})
export class PropiedadesListComponent {
  private readonly api = inject(PropiedadApiService);
  private readonly notification = inject(OrmanNotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly search$ = new Subject<SearchInput>();
  private readonly listRequests$ = new Subject<PropiedadListFilters>();
  private readonly pageSize = 20;
  private readonly sort = 'nombre,asc';
  private searchRevision = 0;

  protected readonly title = signal('Mis Propiedades');
  protected readonly searchQuery = signal('');
  protected readonly page = signal<PageResponse<Propiedad> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly resumen = signal<PropiedadResumen | null>(null);
  protected readonly resumenLoading = signal(true);
  protected readonly resumenError = signal<string | null>(null);
  protected readonly filters = signal<PropiedadListFilters>({
    q: '',
    tipo: null,
    estado: null,
    page: 0,
    size: this.pageSize,
    sort: this.sort,
  });
  protected readonly openFilter = signal<FilterMenu | null>(null);
  protected readonly modal = signal<ModalMode>(null);
  protected readonly statusOperation = signal<PropiedadStatusOperation>('deactivate');
  protected readonly selected = signal<Propiedad | null>(null);
  protected readonly submitting = signal(false);
  protected readonly feedback = signal<string | null>(null);
  protected readonly loadingCards = [0, 1, 2, 3, 4, 5];
  protected readonly typeOptions: readonly FilterOption[] = [
    { value: '', label: 'Todos los tipos' },
    { value: 'CASA', label: 'Casa' },
    { value: 'EDIFICIO', label: 'Edificio' },
  ];
  protected readonly statusOptions: readonly FilterOption[] = [
    { value: '', label: 'Todos los estados' },
    { value: '1', label: 'Activa' },
    { value: '0', label: 'Inactiva' },
  ];

  constructor() {
    this.search$
      .pipe(
        debounceTime(350),
        distinctUntilChanged((previous, current) => previous.query === current.query),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ query, revision }) => {
        if (revision !== this.searchRevision) {
          return;
        }

        this.load({ q: query, page: 0 });
      });

    this.listRequests$
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

    this.load();
    this.loadResumen();
  }

  protected search(event: Event): void {
    const query = (event.target as HTMLInputElement).value;

    this.searchQuery.set(query);
    this.searchRevision += 1;
    this.search$.next({ query, revision: this.searchRevision });
  }

  protected createProperty(): void {
    void this.router.navigate(['/app/propiedades/nueva']);
  }

  protected editProperty(propiedad: Propiedad): void {
    void this.router.navigate(['/app/propiedades', propiedad.codprop, 'editar']);
  }

  protected detailProperty(propiedad: Propiedad): void {
    void this.router.navigate(['/app/propiedades', propiedad.codprop, 'detalle']);
  }

  protected activateProperty(propiedad: Propiedad): void {
    this.openStatus(propiedad, 'activate');
  }

  protected deactivateProperty(propiedad: Propiedad): void {
    this.openStatus(propiedad, 'deactivate');
  }

  protected closeModal(): void {
    this.modal.set(null);
    this.selected.set(null);
    this.feedback.set(null);
  }

  protected submitStatus(): void {
    const selectedProperty = this.selected();

    if (!selectedProperty || this.submitting()) {
      return;
    }

    const deactivating = this.statusOperation() === 'deactivate';
    this.submitting.set(true);
    this.feedback.set(null);
    const request$ = deactivating
      ? this.api.deactivate(selectedProperty.codprop)
      : this.api.activate(selectedProperty.codprop);

    request$
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.closeModal();
          this.load();
          this.loadResumen();
          this.notification.success(
            deactivating
              ? 'Propiedad desactivada correctamente.'
              : 'Propiedad activada correctamente.',
          );
        },
        error: (requestError: unknown) => this.consumeStatusError(requestError),
      });
  }

  protected setType(value: string): void {
    const tipo: PropiedadTipo | null = value === 'CASA' || value === 'EDIFICIO' ? value : null;

    this.invalidatePendingSearch();
    this.load({ q: this.searchQuery(), tipo, page: 0 });
    this.closeFilter(true, 'type');
  }

  protected setStatus(value: string): void {
    let estado: PropiedadEstado | null = null;

    if (value === '1') {
      estado = 1;
    } else if (value === '0') {
      estado = 0;
    }

    this.invalidatePendingSearch();
    this.load({ q: this.searchQuery(), estado, page: 0 });
    this.closeFilter(true, 'status');
  }

  protected selectedFilterLabel(filter: FilterMenu): string {
    const options = this.filterOptions(filter);
    const selectedValue = this.selectedFilterValue(filter);

    return options.find((option) => option.value === selectedValue)?.label ?? options[0].label;
  }

  protected selectedFilterValue(filter: FilterMenu): string {
    const filters = this.filters();

    return filter === 'type' ? (filters.tipo ?? '') : String(filters.estado ?? '');
  }

  protected toggleFilter(filter: FilterMenu): void {
    if (this.openFilter() === filter) {
      this.closeFilter();
      return;
    }

    this.openFilter.set(filter);
    this.focusFilterOption(filter, this.selectedFilterIndex(filter));
  }

  protected selectFilter(filter: FilterMenu, value: string): void {
    if (filter === 'type') {
      this.setType(value);
      return;
    }

    this.setStatus(value);
  }

  protected handleFilterTriggerKeydown(event: KeyboardEvent, filter: FilterMenu): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }

    event.preventDefault();
    this.openFilter.set(filter);
    this.focusFilterOption(filter, this.selectedFilterIndex(filter));
  }

  protected handleFilterOptionKeydown(
    event: KeyboardEvent,
    filter: FilterMenu,
    index: number,
  ): void {
    const options = this.filterOptions(filter);

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeFilter(true, filter);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectFilter(filter, options[index].value);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const offset = event.key === 'ArrowDown' ? 1 : -1;
      this.focusFilterOption(filter, (index + offset + options.length) % options.length);
    }
  }

  @HostListener('document:click', ['$event'])
  protected closeFilterOnOutsideClick(event: MouseEvent): void {
    const target = event.target;

    if (this.openFilter() && target instanceof Node && !this.host.nativeElement.contains(target)) {
      this.closeFilter();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  protected closeFilterOnEscape(event: Event): void {
    if (!this.openFilter()) {
      return;
    }

    event.preventDefault();
    this.closeFilter(true);
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.invalidatePendingSearch();
    this.load({ q: '', tipo: null, estado: null, page: 0 });
  }

  protected hasFilters(): boolean {
    const filters = this.filters();

    return Boolean(this.searchQuery().trim() || filters.tipo || filters.estado !== null);
  }

  protected changePage(page: number): void {
    const currentPage = this.page();

    if (page >= 0 && currentPage && page < currentPage.totalPages && page !== currentPage.page) {
      this.load({ page });
    }
  }

  private load(change: Partial<PropiedadListFilters> = {}): void {
    const filters = { ...this.filters(), ...change };
    this.filters.set(filters);
    this.loading.set(true);
    this.error.set(null);
    this.listRequests$.next(filters);
  }

  private loadResumen(): void {
    this.resumenLoading.set(true);
    this.resumenError.set(null);

    this.api
      .getResumen()
      .pipe(
        finalize(() => this.resumenLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (resumen) => this.resumen.set(resumen),
        error: (requestError: unknown) => {
          this.resumen.set(null);
          this.resumenError.set(
            this.errorMessage(requestError, 'No se pudo cargar el resumen de propiedades.'),
          );
        },
      });
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

  private filterOptions(filter: FilterMenu): readonly FilterOption[] {
    return filter === 'type' ? this.typeOptions : this.statusOptions;
  }

  private selectedFilterIndex(filter: FilterMenu): number {
    return Math.max(
      this.filterOptions(filter).findIndex(
        (option) => option.value === this.selectedFilterValue(filter),
      ),
      0,
    );
  }

  private closeFilter(restoreFocus = false, filter = this.openFilter()): void {
    this.openFilter.set(null);

    if (restoreFocus && filter) {
      queueMicrotask(() => {
        this.host.nativeElement
          .querySelector<HTMLButtonElement>(`#property-${filter}-trigger`)
          ?.focus();
      });
    }
  }

  private focusFilterOption(filter: FilterMenu, index: number): void {
    queueMicrotask(() => {
      this.host.nativeElement
        .querySelector<HTMLElement>(`[data-filter="${filter}"][data-index="${index}"]`)
        ?.focus();
    });
  }

  private invalidatePendingSearch(): void {
    this.searchRevision += 1;
  }

  private openStatus(propiedad: Propiedad, operation: PropiedadStatusOperation): void {
    if (this.submitting()) {
      return;
    }

    this.selected.set(propiedad);
    this.statusOperation.set(operation);
    this.feedback.set(null);
    this.modal.set('status');
  }

  private consumeStatusError(requestError: unknown): void {
    const problem =
      requestError instanceof HttpErrorResponse && isProblemDetail(requestError.error)
        ? requestError.error
        : null;

    this.feedback.set(problem?.detail ?? 'No fue posible completar la operación.');
  }

  private errorMessage(
    requestError: unknown,
    fallback = 'No fue posible cargar las propiedades.',
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
