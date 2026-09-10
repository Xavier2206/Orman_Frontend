import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import {
  Observable,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  merge,
  of,
  switchMap,
  tap,
} from 'rxjs';

import { isProblemDetail } from '../../../../core/api/problem-detail.model';
import { AuthContextService } from '../../../../core/auth/auth-context.service';
import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { MenuApiService } from '../../../menus/data/menu-api.service';
import { Menu, MenuListParams } from '../../../menus/models/menu.model';
import { PageResponse } from '../../../personas/models/persona.model';
import { AsignarProcesosApiService } from '../../data/asignar-procesos-api.service';
import { ProcesoApiService } from '../../data/proceso-api.service';
import { MeProResponse } from '../../models/me-pro-response.model';
import { Proceso } from '../../models/proceso.model';

interface MenuPageRequest {
  readonly page: number;
  readonly query: string;
}

type MenuLoadResult =
  | { readonly response: PageResponse<Menu>; readonly error: null }
  | { readonly response: null; readonly error: string };

type ProcessLoadResult =
  | { readonly processes: readonly MeProResponse[]; readonly error: null }
  | { readonly processes: null; readonly error: string };

@Component({
  selector: 'app-asignar-procesos-list',
  imports: [MatIconModule],
  templateUrl: './asignar-procesos-list.component.html',
  styleUrl: './asignar-procesos-list.component.css',
})
export class AsignarProcesosListComponent {
  private readonly assignmentApi = inject(AsignarProcesosApiService);
  private readonly menuApi = inject(MenuApiService);
  private readonly procesoApi = inject(ProcesoApiService);
  private readonly authContext = inject(AuthContextService);
  private readonly notification = inject(OrmanNotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly menuSearch$ = new Subject<string>();
  private readonly menuPageRequest$ = new Subject<MenuPageRequest>();
  private readonly selectedMenu$ = new Subject<number>();
  private readonly processPageSize = 4;
  private readonly menuPageSize = 10;

  protected readonly page = signal<PageResponse<Menu> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly menuQuery = signal('');
  protected readonly selectedMenu = signal<Menu | null>(null);
  protected readonly assignedProcesses = signal<readonly MeProResponse[]>([]);
  protected readonly assignmentLoading = signal(false);
  protected readonly assignmentError = signal<string | null>(null);
  protected readonly activeProcesses = signal<readonly Proceso[]>([]);
  protected readonly processesLoading = signal(true);
  protected readonly processesError = signal<string | null>(null);
  protected readonly assignedProcessQuery = signal('');
  protected readonly availableProcessQuery = signal('');
  protected readonly processActionCodp = signal<number | null>(null);
  protected readonly processActionError = signal<string | null>(null);
  protected readonly assignedProcessPage = signal(0);
  protected readonly availableProcessPage = signal(0);
  protected readonly availableProcesses = computed(() => {
    const assignedCodes = new Set(this.assignedProcesses().map((process) => process.codp));

    return this.activeProcesses().filter((process) => !assignedCodes.has(process.codp));
  });
  protected readonly filteredAssignedProcesses = computed(() => {
    const query = this.assignedProcessQuery().trim().toLocaleLowerCase();

    if (!query) {
      return this.assignedProcesses();
    }

    return this.assignedProcesses().filter((process) => this.matchesProcess(process, query));
  });
  protected readonly filteredAvailableProcesses = computed(() => {
    const query = this.availableProcessQuery().trim().toLocaleLowerCase();

    if (!query) {
      return this.availableProcesses();
    }

    return this.availableProcesses().filter((process) => this.matchesProcess(process, query));
  });
  protected readonly assignedProcessPageCount = computed(() =>
    this.pageCount(this.filteredAssignedProcesses().length),
  );
  protected readonly availableProcessPageCount = computed(() =>
    this.pageCount(this.filteredAvailableProcesses().length),
  );
  protected readonly assignedProcessPageIndex = computed(() =>
    this.clampPage(this.assignedProcessPage(), this.assignedProcessPageCount()),
  );
  protected readonly availableProcessPageIndex = computed(() =>
    this.clampPage(this.availableProcessPage(), this.availableProcessPageCount()),
  );
  protected readonly pagedAssignedProcesses = computed(() => {
    const start = this.assignedProcessPageIndex() * this.processPageSize;

    return this.filteredAssignedProcesses().slice(start, start + this.processPageSize);
  });
  protected readonly pagedAvailableProcesses = computed(() => {
    const start = this.availableProcessPageIndex() * this.processPageSize;

    return this.filteredAvailableProcesses().slice(start, start + this.processPageSize);
  });

  constructor() {
    merge(
      this.menuPageRequest$,
      this.menuSearch$.pipe(
        debounceTime(350),
        distinctUntilChanged(),
        map((query): MenuPageRequest => ({ page: 0, query })),
      ),
    )
      .pipe(
        switchMap((request) => this.loadMenuPage(request)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.loading.set(false);

        if (result.response === null) {
          this.page.set(null);
          this.error.set(result.error);
          return;
        }

        if (result.response.totalPages > 0 && result.response.page >= result.response.totalPages) {
          this.requestMenus(result.response.totalPages - 1, this.menuQuery().trim());
          return;
        }

        this.page.set(result.response);
      });

    this.selectedMenu$
      .pipe(
        tap(() => {
          this.assignedProcesses.set([]);
          this.assignedProcessPage.set(0);
          this.availableProcessPage.set(0);
          this.assignmentLoading.set(true);
          this.assignmentError.set(null);
          this.processActionError.set(null);
        }),
        switchMap((codm) =>
          this.assignmentApi.listAssignedProcesses(codm).pipe(
            map((processes): ProcessLoadResult => ({ processes, error: null })),
            catchError((error: unknown) =>
              of<ProcessLoadResult>({
                processes: null,
                error: this.errorMessage(error, 'los Procesos'),
              }),
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.assignmentLoading.set(false);

        if (result.processes === null) {
          this.assignmentError.set(result.error);
          return;
        }

        this.assignedProcesses.set(result.processes);
      });

    this.requestMenus(0, '');
    this.loadProcessCatalog();
  }

  protected searchMenus(event: Event): void {
    const query = (event.target as HTMLInputElement).value;

    this.menuQuery.set(query);
    this.loading.set(true);
    this.error.set(null);
    this.menuSearch$.next(query.trim());
  }

  protected selectMenu(menu: Menu): void {
    this.selectedMenu.set(menu);
    this.selectedMenu$.next(menu.codm);
  }

  protected changeMenuPage(page: number): void {
    const currentPage = this.page();

    if (!currentPage || page < 0 || page >= currentPage.totalPages || page === currentPage.page) {
      return;
    }

    this.requestMenus(page, this.menuQuery().trim());
  }

  protected isSelected(menu: Menu): boolean {
    return this.selectedMenu()?.codm === menu.codm;
  }

  protected searchAssignedProcesses(event: Event): void {
    this.assignedProcessQuery.set((event.target as HTMLInputElement).value);
    this.assignedProcessPage.set(0);
  }

  protected searchAvailableProcesses(event: Event): void {
    this.availableProcessQuery.set((event.target as HTMLInputElement).value);
    this.availableProcessPage.set(0);
  }

  protected iconName(menu: Menu): string {
    return menu.icono?.trim() || 'menu';
  }

  protected assignProcess(process: Proceso): void {
    this.updateProcessAssignment(process, 'assign');
  }

  protected removeProcess(process: MeProResponse): void {
    this.updateProcessAssignment(process, 'remove');
  }

  protected changeAssignedProcessPage(direction: -1 | 1): void {
    this.assignedProcessPage.set(
      this.nextPage(this.assignedProcessPageIndex(), direction, this.assignedProcessPageCount()),
    );
  }

  protected changeAvailableProcessPage(direction: -1 | 1): void {
    this.availableProcessPage.set(
      this.nextPage(this.availableProcessPageIndex(), direction, this.availableProcessPageCount()),
    );
  }

  protected statusLabel(item: Menu | Proceso | MeProResponse): string {
    const estado = 'estadoProceso' in item ? item.estadoProceso : item.estado;

    return estado === 1 ? 'Activo' : 'Inactivo';
  }

  private requestMenus(page: number, query: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.menuPageRequest$.next({ page, query });
  }

  private loadMenuPage(request: MenuPageRequest): Observable<MenuLoadResult> {
    const filters: MenuListParams = {
      q: request.query,
      estado: 1,
      page: request.page,
      size: this.menuPageSize,
      sort: 'nombre,asc',
    };

    return this.menuApi.list(filters).pipe(
      map((response): MenuLoadResult => ({ response, error: null })),
      catchError((error: unknown) =>
        of<MenuLoadResult>({ response: null, error: this.errorMessage(error, 'los Menús') }),
      ),
    );
  }

  private loadProcessCatalog(): void {
    this.processesLoading.set(true);
    this.processesError.set(null);

    this.procesoApi
      .listCatalog()
      .pipe(
        finalize(() => this.processesLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (processes) => this.activeProcesses.set(processes),
        error: (error: unknown) => {
          this.activeProcesses.set([]);
          this.processesError.set(this.errorMessage(error, 'el catálogo de Procesos'));
        },
      });
  }

  private updateProcessAssignment(
    process: Proceso | MeProResponse,
    operation: 'assign' | 'remove',
  ): void {
    const menu = this.selectedMenu();

    if (!menu || this.processActionCodp() !== null) {
      return;
    }

    this.processActionCodp.set(process.codp);
    this.processActionError.set(null);
    const request: Observable<unknown> =
      operation === 'assign'
        ? this.assignmentApi.assignProcess(menu.codm, process.codp)
        : this.assignmentApi.removeProcess(menu.codm, process.codp);

    request
      .pipe(
        finalize(() => this.processActionCodp.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.notification.success(
            operation === 'assign'
              ? 'Proceso asignado correctamente.'
              : 'Proceso retirado correctamente.',
          );
          this.selectedMenu$.next(menu.codm);
          this.reloadNavigationContext();
        },
        error: (error: unknown) => {
          const message = this.errorMessage(error, 'la asignación del Proceso');
          this.processActionError.set(message);
          this.notification.error(message);
        },
      });
  }

  private errorMessage(error: unknown, resource: string): string {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return 'La sesión ha expirado.';
    }

    if (error instanceof HttpErrorResponse && error.status === 403) {
      return 'Acceso denegado.';
    }

    if (error instanceof HttpErrorResponse && isProblemDetail(error.error)) {
      return error.error.detail ?? this.statusErrorMessage(error.status, resource);
    }

    if (error instanceof HttpErrorResponse) {
      return this.statusErrorMessage(error.status, resource);
    }

    return `No fue posible cargar ${resource}.`;
  }

  private statusErrorMessage(status: number, resource: string): string {
    if (status === 404) {
      return `No se encontró ${resource}.`;
    }

    if (status === 409) {
      return `La operación sobre ${resource} entra en conflicto con el estado actual.`;
    }

    if (status === 422) {
      return `La solicitud para ${resource} no es válida.`;
    }

    return `No fue posible cargar ${resource}.`;
  }

  private matchesProcess(process: Proceso | MeProResponse, query: string): boolean {
    const nombre = 'nombreProceso' in process ? process.nombreProceso : process.nombre;

    return nombre.toLocaleLowerCase().includes(query) || `${process.codp}`.includes(query);
  }

  private reloadNavigationContext(): void {
    this.authContext
      .reloadContext()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          this.notification.error(
            'La operación se completó, pero no se pudo actualizar la navegación.',
          );
        },
      });
  }

  private pageCount(totalItems: number): number {
    return Math.max(1, Math.ceil(totalItems / this.processPageSize));
  }

  private clampPage(page: number, pageCount: number): number {
    return Math.min(page, pageCount - 1);
  }

  private nextPage(page: number, direction: -1 | 1, pageCount: number): number {
    return Math.max(0, Math.min(page + direction, pageCount - 1));
  }
}
