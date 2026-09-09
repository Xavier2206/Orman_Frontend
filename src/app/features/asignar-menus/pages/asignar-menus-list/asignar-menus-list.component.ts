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
import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { MenuApiService } from '../../../menus/data/menu-api.service';
import { Menu } from '../../../menus/models/menu.model';
import { PageResponse } from '../../../personas/models/persona.model';
import { RolApiService } from '../../../roles/data/rol-api.service';
import { Rol, RolListFilters } from '../../../roles/models/rol.model';
import { AsignarMenusApiService } from '../../data/asignar-menus-api.service';

type MenuLoadResult =
  | { readonly menus: readonly Menu[]; readonly error: null }
  | { readonly menus: null; readonly error: string };

interface RolePageRequest {
  readonly page: number;
  readonly query: string;
}

type RoleLoadResult =
  | { readonly response: PageResponse<Rol>; readonly error: null }
  | { readonly response: null; readonly error: string };

interface AssignedMenuCard {
  readonly assignedMenu: Menu;
  readonly menu: Menu;
}

@Component({
  selector: 'app-asignar-menus-list',
  imports: [MatIconModule],
  templateUrl: './asignar-menus-list.component.html',
  styleUrl: './asignar-menus-list.component.css',
})
export class AsignarMenusListComponent {
  private readonly assignmentApi = inject(AsignarMenusApiService);
  private readonly menuApi = inject(MenuApiService);
  private readonly rolApi = inject(RolApiService);
  private readonly notification = inject(OrmanNotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly roleSearch$ = new Subject<string>();
  private readonly rolePageRequest$ = new Subject<RolePageRequest>();
  private readonly selectedRole$ = new Subject<number>();
  private readonly menusPageSize = 4;
  private readonly rolePageSize = 10;

  protected readonly page = signal<PageResponse<Rol> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly roleQuery = signal('');
  protected readonly selectedRole = signal<Rol | null>(null);
  protected readonly assignedMenus = signal<readonly Menu[]>([]);
  protected readonly assignmentLoading = signal(false);
  protected readonly assignmentError = signal<string | null>(null);
  protected readonly activeMenus = signal<readonly Menu[]>([]);
  protected readonly menusLoading = signal(true);
  protected readonly menusError = signal<string | null>(null);
  protected readonly assignedMenuQuery = signal('');
  protected readonly availableMenuQuery = signal('');
  protected readonly menuActionCodm = signal<number | null>(null);
  protected readonly menuActionError = signal<string | null>(null);
  protected readonly assignedMenuPage = signal(0);
  protected readonly availableMenuPage = signal(0);
  protected readonly availableMenus = computed(() => {
    const assignedCodes = new Set(this.assignedMenus().map((menu) => menu.codm));

    return this.activeMenus().filter((menu) => !assignedCodes.has(menu.codm));
  });
  protected readonly assignedMenuCards = computed<readonly AssignedMenuCard[]>(() => {
    const catalogByCode = new Map(this.activeMenus().map((menu) => [menu.codm, menu] as const));

    return this.assignedMenus().map((assignedMenu) => ({
      assignedMenu,
      menu: catalogByCode.get(assignedMenu.codm) ?? assignedMenu,
    }));
  });
  protected readonly filteredAssignedMenuCards = computed(() => {
    const query = this.assignedMenuQuery().trim().toLocaleLowerCase();

    if (!query) {
      return this.assignedMenuCards();
    }

    return this.assignedMenuCards().filter(({ menu }) => this.matchesMenu(menu, query));
  });
  protected readonly filteredAvailableMenus = computed(() => {
    const query = this.availableMenuQuery().trim().toLocaleLowerCase();

    if (!query) {
      return this.availableMenus();
    }

    return this.availableMenus().filter((menu) => this.matchesMenu(menu, query));
  });
  protected readonly assignedMenuPageCount = computed(() =>
    this.pageCount(this.filteredAssignedMenuCards().length),
  );
  protected readonly availableMenuPageCount = computed(() =>
    this.pageCount(this.filteredAvailableMenus().length),
  );
  protected readonly assignedMenuPageIndex = computed(() =>
    this.clampPage(this.assignedMenuPage(), this.assignedMenuPageCount()),
  );
  protected readonly availableMenuPageIndex = computed(() =>
    this.clampPage(this.availableMenuPage(), this.availableMenuPageCount()),
  );
  protected readonly pagedAssignedMenuCards = computed(() => {
    const start = this.assignedMenuPageIndex() * this.menusPageSize;

    return this.filteredAssignedMenuCards().slice(start, start + this.menusPageSize);
  });
  protected readonly pagedAvailableMenus = computed(() => {
    const start = this.availableMenuPageIndex() * this.menusPageSize;

    return this.filteredAvailableMenus().slice(start, start + this.menusPageSize);
  });

  constructor() {
    merge(
      this.rolePageRequest$,
      this.roleSearch$.pipe(
        debounceTime(350),
        distinctUntilChanged(),
        map((query): RolePageRequest => ({ page: 0, query })),
      ),
    )
      .pipe(
        switchMap((request) => this.loadRolePage(request)),
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
          this.requestRoles(result.response.totalPages - 1, this.roleQuery().trim());
          return;
        }

        this.page.set(result.response);
      });

    this.selectedRole$
      .pipe(
        tap(() => {
          this.assignedMenus.set([]);
          this.assignedMenuPage.set(0);
          this.availableMenuPage.set(0);
          this.assignmentLoading.set(true);
          this.assignmentError.set(null);
          this.menuActionError.set(null);
        }),
        switchMap((codr) =>
          this.assignmentApi.listAssignedMenus(codr).pipe(
            map((menus): MenuLoadResult => ({ menus, error: null })),
            catchError((error: unknown) =>
              of<MenuLoadResult>({ menus: null, error: this.errorMessage(error, 'los Menús') }),
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.assignmentLoading.set(false);

        if (result.menus === null) {
          this.assignmentError.set(result.error);
          return;
        }

        this.assignedMenus.set(result.menus);
      });

    this.requestRoles(0, '');
    this.loadActiveMenus();
  }

  protected searchRoles(event: Event): void {
    const query = (event.target as HTMLInputElement).value;

    this.roleQuery.set(query);
    this.loading.set(true);
    this.error.set(null);
    this.roleSearch$.next(query.trim());
  }

  protected selectRole(role: Rol): void {
    this.selectedRole.set(role);
    this.selectedRole$.next(role.codr);
  }

  protected changeRolePage(page: number): void {
    const currentPage = this.page();

    if (!currentPage || page < 0 || page >= currentPage.totalPages || page === currentPage.page) {
      return;
    }

    this.requestRoles(page, this.roleQuery().trim());
  }

  protected isSelected(role: Rol): boolean {
    return this.selectedRole()?.codr === role.codr;
  }

  protected searchAssignedMenus(event: Event): void {
    this.assignedMenuQuery.set((event.target as HTMLInputElement).value);
    this.assignedMenuPage.set(0);
  }

  protected searchAvailableMenus(event: Event): void {
    this.availableMenuQuery.set((event.target as HTMLInputElement).value);
    this.availableMenuPage.set(0);
  }

  protected statusLabel(item: Rol | Menu): string {
    return item.estado === 1 ? 'Activo' : 'Inactivo';
  }

  protected iconName(menu: Menu): string {
    return menu.icono?.trim() || 'menu';
  }

  protected assignMenu(menu: Menu): void {
    this.updateMenuAssignment(menu, 'assign');
  }

  protected removeMenu(menu: Menu): void {
    this.updateMenuAssignment(menu, 'remove');
  }

  protected changeAssignedMenuPage(direction: -1 | 1): void {
    this.assignedMenuPage.set(
      this.nextPage(this.assignedMenuPageIndex(), direction, this.assignedMenuPageCount()),
    );
  }

  protected changeAvailableMenuPage(direction: -1 | 1): void {
    this.availableMenuPage.set(
      this.nextPage(this.availableMenuPageIndex(), direction, this.availableMenuPageCount()),
    );
  }

  private requestRoles(page: number, query: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.rolePageRequest$.next({ page, query });
  }

  private loadRolePage(request: RolePageRequest): Observable<RoleLoadResult> {
    const filters: RolListFilters = {
      q: request.query,
      estado: 1,
      page: request.page,
      size: this.rolePageSize,
      sort: 'nombre,asc',
    };

    return this.rolApi.list(filters).pipe(
      map((response): RoleLoadResult => ({ response, error: null })),
      catchError((error: unknown) =>
        of<RoleLoadResult>({ response: null, error: this.errorMessage(error, 'los Roles') }),
      ),
    );
  }

  private loadActiveMenus(): void {
    this.menusLoading.set(true);
    this.menusError.set(null);

    this.menuApi
      .listActiveCatalog()
      .pipe(
        finalize(() => this.menusLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (menus) => this.activeMenus.set(menus),
        error: (error: unknown) => {
          this.activeMenus.set([]);
          this.menusError.set(this.errorMessage(error, 'el catálogo de Menús'));
        },
      });
  }

  private updateMenuAssignment(menu: Menu, operation: 'assign' | 'remove'): void {
    const role = this.selectedRole();

    if (!role || this.menuActionCodm() !== null) {
      return;
    }

    this.menuActionCodm.set(menu.codm);
    this.menuActionError.set(null);
    const request =
      operation === 'assign'
        ? this.assignmentApi.assignMenu(role.codr, menu.codm)
        : this.assignmentApi.removeMenu(role.codr, menu.codm);

    request
      .pipe(
        finalize(() => this.menuActionCodm.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.notification.success(
            operation === 'assign'
              ? 'Menú asignado correctamente.'
              : 'Menú retirado correctamente.',
          );
          this.selectedRole$.next(role.codr);
        },
        error: (error: unknown) => {
          const message = this.errorMessage(error, 'la asignación del Menú');
          this.menuActionError.set(message);
          this.notification.error(message);
        },
      });
  }

  private errorMessage(error: unknown, resource: string): string {
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

  private matchesMenu(menu: Menu, query: string): boolean {
    return menu.nombre.toLocaleLowerCase().includes(query) || `${menu.codm}`.includes(query);
  }

  private pageCount(totalItems: number): number {
    return Math.max(1, Math.ceil(totalItems / this.menusPageSize));
  }

  private clampPage(page: number, pageCount: number): number {
    return Math.min(page, pageCount - 1);
  }

  private nextPage(page: number, direction: -1 | 1, pageCount: number): number {
    return Math.max(0, Math.min(page + direction, pageCount - 1));
  }
}
