import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
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
import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { PageResponse } from '../../../personas/models/persona.model';
import {
  MenuFormModalComponent,
  MenuFormMode,
  MenuFormSubmission,
} from '../../components/menu-form-modal/menu-form-modal.component';
import {
  MenuStatusConfirmModalComponent,
  MenuStatusOperation,
} from '../../components/menu-status-confirm-modal/menu-status-confirm-modal.component';
import { MenuApiService } from '../../data/menu-api.service';
import { Menu, MenuListParams, MenuResumen } from '../../models/menu.model';

type FilterMenu = 'status';
type ModalMode = 'form' | 'status' | null;

interface FilterOption {
  readonly label: string;
  readonly value: string;
}

type ListResult =
  | { readonly page: PageResponse<Menu>; readonly error: null }
  | { readonly page: null; readonly error: string };

@Component({
  selector: 'app-menus-list',
  imports: [MatIconModule, MenuFormModalComponent, MenuStatusConfirmModalComponent],
  templateUrl: './menus-list.component.html',
  styleUrl: './menus-list.component.css',
})
export class MenusListComponent {
  private readonly api = inject(MenuApiService);
  private readonly notification = inject(OrmanNotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly pageSize = 10;
  private readonly sort = 'nombre,asc';
  private readonly search$ = new Subject<string>();
  private readonly listRequests$ = new Subject<MenuListParams>();

  protected readonly page = signal<PageResponse<Menu> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly resumen = signal<MenuResumen | null>(null);
  protected readonly resumenLoading = signal(true);
  protected readonly resumenError = signal(false);
  protected readonly filters = signal<MenuListParams>({
    q: '',
    estado: null,
    page: 0,
    size: this.pageSize,
    sort: this.sort,
  });
  protected readonly openFilter = signal<FilterMenu | null>(null);
  protected readonly modal = signal<ModalMode>(null);
  protected readonly formMode = signal<MenuFormMode>('create');
  protected readonly statusOperation = signal<MenuStatusOperation>('deactivate');
  protected readonly selected = signal<Menu | null>(null);
  protected readonly submitting = signal(false);
  protected readonly feedback = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});
  protected readonly mobileMenu = signal<number | null>(null);
  protected readonly loadingCards = [0, 1, 2, 3, 4, 5];
  protected readonly statusOptions: readonly FilterOption[] = [
    { value: '', label: 'Todos los estados' },
    { value: '1', label: 'Activos' },
    { value: '0', label: 'Inactivos' },
  ];

  constructor() {
    this.search$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((q) => this.load({ q, page: 0 }));

    this.listRequests$
      .pipe(
        switchMap((filters) =>
          this.api.list(filters).pipe(
            map((page): ListResult => ({ page, error: null })),
            catchError((error: unknown) =>
              of<ListResult>({ page: null, error: this.errorMessage(error) }),
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
    this.search$.next((event.target as HTMLInputElement).value);
  }

  protected setStatus(value: string): void {
    this.load({ estado: value === '1' ? 1 : value === '0' ? 0 : null, page: 0 });
  }

  protected selectedFilterLabel(): string {
    return (
      this.statusOptions.find((option) => option.value === this.selectedFilterValue())?.label ??
      'Todos los estados'
    );
  }

  protected selectedFilterValue(): string {
    return String(this.filters().estado ?? '');
  }

  protected toggleFilter(): void {
    if (this.openFilter()) {
      this.closeFilter();
      return;
    }

    this.openFilter.set('status');
    this.focusFilterOption(this.selectedFilterIndex());
  }

  protected selectStatus(value: string): void {
    this.setStatus(value);
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
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeFilter(true);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectStatus(this.statusOptions[index].value);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const offset = event.key === 'ArrowDown' ? 1 : -1;
      this.focusFilterOption(
        (index + offset + this.statusOptions.length) % this.statusOptions.length,
      );
    }
  }

  @HostListener('document:click', ['$event'])
  protected closeFilterOnOutsideClick(event: MouseEvent): void {
    const target = event.target;

    if (target instanceof Node && !this.host.nativeElement.contains(target)) {
      this.closeFilter();
      this.mobileMenu.set(null);
    }
  }

  protected clearFilters(): void {
    this.load({ q: '', estado: null, page: 0 });
  }

  protected hasFilters(): boolean {
    const filters = this.filters();
    return Boolean(filters.q || filters.estado !== null);
  }

  protected changePage(pageIndex: number): void {
    const currentPage = this.page();

    if (
      !currentPage ||
      pageIndex < 0 ||
      pageIndex >= currentPage.totalPages ||
      pageIndex === currentPage.page
    ) {
      return;
    }

    this.load({ page: pageIndex });
  }

  protected openCreate(): void {
    this.selected.set(null);
    this.formMode.set('create');
    this.open('form');
  }

  protected openEdit(menu: Menu): void {
    this.selected.set(menu);
    this.formMode.set('edit');
    this.open('form');
  }

  protected openStatus(menu: Menu): void {
    this.selected.set(menu);
    this.statusOperation.set(menu.estado === 1 ? 'deactivate' : 'activate');
    this.open('status');
  }

  protected closeModal(): void {
    this.modal.set(null);
    this.selected.set(null);
    this.submitting.set(false);
    this.feedback.set(null);
    this.fieldErrors.set({});
  }

  protected submitMenu(submission: MenuFormSubmission): void {
    const selectedMenu = this.selected();

    if (submission.mode === 'edit' && !selectedMenu) {
      return;
    }

    this.submitting.set(true);
    this.feedback.set(null);
    this.fieldErrors.set({});

    const request$ =
      submission.mode === 'create'
        ? this.api.create(submission.request)
        : this.api.update(selectedMenu!.codm, submission.request);

    request$
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          const creating = submission.mode === 'create';
          this.closeModal();
          this.load();
          if (creating) {
            this.loadResumen();
          }

          this.notification.success(
            creating ? 'Menú creado correctamente.' : 'Menú actualizado correctamente.',
          );
        },
        error: (error: unknown) => this.consumeError(error),
      });
  }

  protected submitStatus(): void {
    const selectedMenu = this.selected();

    if (!selectedMenu) {
      return;
    }

    const deactivating = this.statusOperation() === 'deactivate';
    this.submitting.set(true);
    this.feedback.set(null);
    this.fieldErrors.set({});

    const request$ = deactivating
      ? this.api.deactivate(selectedMenu.codm)
      : this.api.activate(selectedMenu.codm);

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
              ? 'Menú desactivado correctamente.'
              : 'Menú reactivado correctamente.',
          );
        },
        error: (error: unknown) => this.consumeError(error),
      });
  }

  protected toggleMobileMenu(codm: number): void {
    this.mobileMenu.update((open) => (open === codm ? null : codm));
  }

  protected statusLabel(menu: Menu): string {
    return menu.estado === 1 ? 'Activo' : 'Inactivo';
  }

  protected iconName(menu: Menu): string {
    return menu.icono?.trim() || 'menu';
  }

  private load(change: Partial<MenuListParams> = {}): void {
    const filters = { ...this.filters(), ...change };

    this.filters.set(filters);
    this.loading.set(true);
    this.error.set(null);
    this.listRequests$.next(filters);
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

  private selectedFilterIndex(): number {
    return Math.max(
      this.statusOptions.findIndex((option) => option.value === this.selectedFilterValue()),
      0,
    );
  }

  private closeFilter(restoreFocus = false): void {
    this.openFilter.set(null);

    if (restoreFocus) {
      queueMicrotask(() => {
        this.host.nativeElement.querySelector<HTMLButtonElement>('#menu-status-trigger')?.focus();
      });
    }
  }

  private focusFilterOption(index: number): void {
    queueMicrotask(() => {
      this.host.nativeElement
        .querySelector<HTMLElement>(
          '[data-filter="status"][data-index="' + index + '"]',
        )
        ?.focus();
    });
  }

  private open(mode: ModalMode): void {
    this.mobileMenu.set(null);
    this.feedback.set(null);
    this.fieldErrors.set({});
    this.modal.set(mode);
  }

  private loadResumen(): void {
    this.resumenLoading.set(true);
    this.resumenError.set(false);
    this.api
      .resumen()
      .pipe(
        finalize(() => this.resumenLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (resumen) => this.resumen.set(resumen),
        error: () => {
          this.resumen.set(null);
          this.resumenError.set(true);
        },
      });
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && isProblemDetail(error.error)) {
      return error.error.detail ?? 'No fue posible cargar los Menús.';
    }

    return 'No fue posible cargar los Menús.';
  }

  private consumeError(error: unknown): void {
    const problem =
      error instanceof HttpErrorResponse && isProblemDetail(error.error) ? error.error : null;

    this.feedback.set(problem?.detail ?? 'No fue posible completar la operación.');
    this.fieldErrors.set(
      Object.fromEntries((problem?.fieldErrors ?? []).map((field) => [field.field, field.message])),
    );
  }
}
