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
import { PageResponse, Persona } from '../../../personas/models/persona.model';
import { PersonaApiService } from '../../../personas/data/persona-api.service';
import { RolApiService } from '../../../roles/data/rol-api.service';
import { Rol } from '../../../roles/models/rol.model';
import { AsignarRolesApiService } from '../../data/asignar-roles-api.service';
import { Usuario } from '../../models/usuario.model';

type RoleLoadResult =
  | { readonly roles: readonly Rol[]; readonly error: null }
  | { readonly roles: null; readonly error: string };

interface UserPageRequest {
  readonly page: number;
  readonly query: string;
}

type UserLoadResult =
  | { readonly response: PageResponse<Usuario>; readonly error: null }
  | { readonly response: null; readonly error: string };

@Component({
  selector: 'app-asignar-roles-list',
  imports: [MatIconModule],
  templateUrl: './asignar-roles-list.component.html',
  styleUrl: './asignar-roles-list.component.css',
})
export class AsignarRolesListComponent {
  private readonly assignmentApi = inject(AsignarRolesApiService);
  private readonly personaApi = inject(PersonaApiService);
  private readonly rolApi = inject(RolApiService);
  private readonly notification = inject(OrmanNotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly selectedLogin$ = new Subject<string>();
  private readonly selectedPersonCode$ = new Subject<number>();
  private readonly userSearch$ = new Subject<string>();
  private readonly userPageRequest$ = new Subject<UserPageRequest>();
  private readonly rolesPageSize = 4;

  protected readonly page = signal<PageResponse<Usuario> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly userQuery = signal('');
  protected readonly roleQuery = signal('');
  protected readonly assignedRoleQuery = signal('');
  protected readonly selectedUser = signal<Usuario | null>(null);
  protected readonly selectedPersona = signal<Persona | null>(null);
  protected readonly personaLoading = signal(false);
  protected readonly personaError = signal<string | null>(null);
  protected readonly assignedRoles = signal<readonly Rol[]>([]);
  protected readonly assignmentLoading = signal(false);
  protected readonly assignmentError = signal<string | null>(null);
  protected readonly activeRoles = signal<readonly Rol[]>([]);
  protected readonly rolesLoading = signal(true);
  protected readonly rolesError = signal<string | null>(null);
  protected readonly roleActionCodr = signal<number | null>(null);
  protected readonly roleActionError = signal<string | null>(null);
  protected readonly assignedRolePage = signal(0);
  protected readonly availableRolePage = signal(0);
  protected readonly availableRoles = computed(() => {
    const assignedCodes = new Set(this.assignedRoles().map((role) => role.codr));

    return this.activeRoles().filter((role) => !assignedCodes.has(role.codr));
  });
  protected readonly filteredAvailableRoles = computed(() => {
    const query = this.roleQuery().trim().toLocaleLowerCase();
    const roles = this.availableRoles();

    if (!query) {
      return roles;
    }

    return roles.filter(
      (role) => role.nombre.toLocaleLowerCase().includes(query) || `${role.codr}`.includes(query),
    );
  });
  protected readonly assignedRoleCards = computed(() => {
    const catalogByCode = new Map(this.activeRoles().map((role) => [role.codr, role] as const));

    return this.assignedRoles().map((assignedRole) => ({
      assignedRole,
      catalogRole: catalogByCode.get(assignedRole.codr) ?? null,
    }));
  });
  protected readonly filteredAssignedRoleCards = computed(() => {
    const query = this.assignedRoleQuery().trim().toLocaleLowerCase();
    const roleCards = this.assignedRoleCards();

    if (!query) {
      return roleCards;
    }

    return roleCards.filter((roleCard) => {
      const roleName = roleCard.catalogRole?.nombre ?? roleCard.assignedRole.nombre;

      return (
        roleName.toLocaleLowerCase().includes(query) ||
        `${roleCard.assignedRole.codr}`.includes(query)
      );
    });
  });
  protected readonly assignedRolePageCount = computed(() =>
    this.pageCount(this.filteredAssignedRoleCards().length),
  );
  protected readonly availableRolePageCount = computed(() =>
    this.pageCount(this.filteredAvailableRoles().length),
  );
  protected readonly assignedRolePageIndex = computed(() =>
    this.clampPage(this.assignedRolePage(), this.assignedRolePageCount()),
  );
  protected readonly availableRolePageIndex = computed(() =>
    this.clampPage(this.availableRolePage(), this.availableRolePageCount()),
  );
  protected readonly pagedAssignedRoleCards = computed(() => {
    const start = this.assignedRolePageIndex() * this.rolesPageSize;

    return this.filteredAssignedRoleCards().slice(start, start + this.rolesPageSize);
  });
  protected readonly pagedAvailableRoles = computed(() => {
    const start = this.availableRolePageIndex() * this.rolesPageSize;

    return this.filteredAvailableRoles().slice(start, start + this.rolesPageSize);
  });

  constructor() {
    merge(
      this.userPageRequest$,
      this.userSearch$.pipe(
        debounceTime(350),
        distinctUntilChanged(),
        map((query): UserPageRequest => ({ page: 0, query })),
      ),
    )
      .pipe(
        switchMap((request) => this.loadUserPage(request)),
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
          this.requestUsers(result.response.totalPages - 1, this.userQuery().trim());
          return;
        }

        this.page.set(result.response);
      });

    this.selectedLogin$
      .pipe(
        tap(() => {
          this.assignedRoles.set([]);
          this.assignedRolePage.set(0);
          this.availableRolePage.set(0);
          this.assignmentLoading.set(true);
          this.assignmentError.set(null);
          this.roleActionError.set(null);
        }),
        switchMap((login) =>
          this.assignmentApi.listAssignedRoles(login).pipe(
            map((roles): RoleLoadResult => ({ roles, error: null })),
            catchError((error: unknown) =>
              of<RoleLoadResult>({ roles: null, error: this.errorMessage(error, 'los Roles') }),
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.assignmentLoading.set(false);

        if (result.roles === null) {
          this.assignmentError.set(result.error);
          return;
        }

        this.assignedRoles.set(result.roles);
      });

    this.selectedPersonCode$
      .pipe(
        tap(() => {
          this.selectedPersona.set(null);
          this.personaLoading.set(true);
          this.personaError.set(null);
        }),
        switchMap((codper) =>
          this.personaApi.get(codper).pipe(
            map((persona) => ({ persona, error: null })),
            catchError((error: unknown) =>
              of({ persona: null, error: this.errorMessage(error, 'la información personal') }),
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.personaLoading.set(false);

        if (result.persona === null) {
          this.personaError.set(result.error);
          return;
        }

        this.selectedPersona.set(result.persona);
      });

    this.requestUsers(0, '');
    this.loadActiveRoles();
  }

  protected searchUsers(event: Event): void {
    const query = (event.target as HTMLInputElement).value;

    this.userQuery.set(query);
    this.loading.set(true);
    this.error.set(null);
    this.userSearch$.next(query.trim());
  }

  protected searchAvailableRoles(event: Event): void {
    this.roleQuery.set((event.target as HTMLInputElement).value);
    this.availableRolePage.set(0);
  }

  protected searchAssignedRoles(event: Event): void {
    this.assignedRoleQuery.set((event.target as HTMLInputElement).value);
    this.assignedRolePage.set(0);
  }

  protected selectUser(user: Usuario): void {
    this.selectedUser.set(user);
    this.selectedLogin$.next(user.login);
    this.selectedPersonCode$.next(user.codper);
  }

  protected changePage(page: number): void {
    const currentPage = this.page();

    if (!currentPage || page < 0 || page >= currentPage.totalPages || page === currentPage.page) {
      return;
    }

    this.requestUsers(page, this.userQuery().trim());
  }

  protected isSelected(user: Usuario): boolean {
    return this.selectedUser()?.login === user.login;
  }

  protected initials(user: Usuario): string {
    const displayName = this.userDisplayName(user);

    if (displayName) {
      return displayName
        .split(' ')
        .map((part) => part.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }

    return user.login.slice(0, 2).toUpperCase();
  }

  protected userDisplayName(user: Usuario): string | null {
    const userFullName = [user.nombre, user.ap, user.am]
      .filter((part): part is string => Boolean(part?.trim()))
      .join(' ');

    if (userFullName) {
      return userFullName;
    }

    const persona = this.selectedPersona();

    return persona && this.selectedUser()?.login === user.login ? this.fullName(persona) : null;
  }

  protected fullName(persona: Persona): string {
    return [persona.nombre, persona.ap, persona.am]
      .filter((part): part is string => Boolean(part?.trim()))
      .join(' ');
  }

  protected personStatusLabel(persona: Persona): string {
    return persona.estado === 1 ? 'Activa' : 'Inactiva';
  }

  protected userStatusLabel(persona: Persona): string {
    if (!persona.usuario) {
      return 'No disponible';
    }

    return persona.usuario.estado === 1 ? 'Activo' : 'Inactivo';
  }

  protected statusLabel(role: Rol): string {
    return role.estado === 1 ? 'Activo' : 'Inactivo';
  }

  protected isProtectedRole(role: Rol): boolean {
    return role.nombre === 'PROPIETARIO';
  }

  protected assignRole(role: Rol): void {
    this.updateAssignment(role, 'assign');
  }

  protected removeRole(role: Rol): void {
    this.updateAssignment(role, 'remove');
  }

  protected changeAssignedRolePage(direction: -1 | 1): void {
    this.assignedRolePage.set(
      this.nextPage(this.assignedRolePageIndex(), direction, this.assignedRolePageCount()),
    );
  }

  protected changeAvailableRolePage(direction: -1 | 1): void {
    this.availableRolePage.set(
      this.nextPage(this.availableRolePageIndex(), direction, this.availableRolePageCount()),
    );
  }

  private requestUsers(page: number, query: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.userPageRequest$.next({ page, query });
  }

  private loadUserPage(request: UserPageRequest): Observable<UserLoadResult> {
    return this.assignmentApi.listUsuarios(request.page, request.query).pipe(
      map((response): UserLoadResult => ({ response, error: null })),
      catchError((error: unknown) =>
        of<UserLoadResult>({ response: null, error: this.errorMessage(error, 'los usuarios') }),
      ),
    );
  }

  private loadActiveRoles(): void {
    this.rolesLoading.set(true);
    this.rolesError.set(null);

    this.rolApi
      .listActiveCatalog()
      .pipe(
        finalize(() => this.rolesLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (roles) => this.activeRoles.set(roles),
        error: (error: unknown) => {
          this.activeRoles.set([]);
          this.rolesError.set(this.errorMessage(error, 'los Roles disponibles'));
        },
      });
  }

  private updateAssignment(role: Rol, operation: 'assign' | 'remove'): void {
    const user = this.selectedUser();

    if (!user || this.roleActionCodr()) {
      return;
    }

    this.roleActionCodr.set(role.codr);
    this.roleActionError.set(null);
    const request =
      operation === 'assign'
        ? this.assignmentApi.assignRole(user.login, role.codr)
        : this.assignmentApi.removeRole(user.login, role.codr);

    request
      .pipe(
        finalize(() => this.roleActionCodr.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.notification.success(
            operation === 'assign' ? 'Rol asignado correctamente.' : 'Rol retirado correctamente.',
          );
          this.selectedLogin$.next(user.login);
        },
        error: (error: unknown) => {
          const message = this.errorMessage(error, 'la asignación del Rol');
          this.roleActionError.set(message);
          this.notification.error(message);
        },
      });
  }

  private errorMessage(error: unknown, resource: string): string {
    if (error instanceof HttpErrorResponse && isProblemDetail(error.error)) {
      return error.error.detail ?? `No fue posible cargar ${resource}.`;
    }

    if (error instanceof HttpErrorResponse && error.status === 403) {
      return 'Acceso denegado.';
    }

    return `No fue posible cargar ${resource}.`;
  }

  private pageCount(totalItems: number): number {
    return Math.max(1, Math.ceil(totalItems / this.rolesPageSize));
  }

  private clampPage(page: number, pageCount: number): number {
    return Math.min(page, pageCount - 1);
  }

  private nextPage(page: number, direction: -1 | 1, pageCount: number): number {
    return Math.max(0, Math.min(page + direction, pageCount - 1));
  }
}
