import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, concatMap, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';

import { apiPath } from '../api/api.constants';
import { AuthContext, AuthContextRol } from './auth-context.model';
import { AuthService } from './auth.service';

const AUTH_CONTEXT_PATH = apiPath('/auth/context');
const CONTEXT_LOAD_ERROR = 'No fue posible recuperar el contexto de la cuenta.';

@Injectable({ providedIn: 'root' })
export class AuthContextService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly contextState = signal<AuthContext | null>(null);
  private readonly loadingState = signal(false);
  private readonly loadedState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly selectedRoleIdState = signal<number | null>(null);
  private contextRequest$: Observable<AuthContext> | null = null;

  readonly context = this.contextState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly loaded = this.loadedState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly persona = computed(() => this.contextState()?.persona ?? null);
  readonly roles = computed(() => this.contextState()?.roles ?? []);
  readonly selectedRoleId = this.selectedRoleIdState.asReadonly();
  readonly selectedRole = computed<AuthContextRol | null>(
    () => this.roles().find((role) => role.codr === this.selectedRoleIdState()) ?? null,
  );
  readonly selectedMenus = computed(() => this.selectedRole()?.menus ?? []);

  constructor() {
    this.auth.registerSessionClearHandler(() => this.clearContext());
  }

  restoreContext(): Observable<void> {
    return this.auth.restoreSession().pipe(
      concatMap(() => {
        if (!this.auth.authenticated()) {
          this.clearContext();
          return of(undefined);
        }

        return this.loadContext().pipe(
          // A failed context is represented in its own state. It does not make a valid session invalid.
          catchError(() => of(null)),
          map(() => undefined),
        );
      }),
    );
  }

  loadContext(): Observable<AuthContext> {
    if (this.contextRequest$) {
      return this.contextRequest$;
    }

    if (this.loadedState() && this.contextState()) {
      return of(this.contextState()!);
    }

    this.loadingState.set(true);
    this.errorState.set(null);
    this.contextRequest$ = this.http.get<AuthContext>(AUTH_CONTEXT_PATH).pipe(
      tap((context) => {
        this.contextState.set(context);
        this.selectedRoleIdState.set(context.roles[0]?.codr ?? null);
        this.loadedState.set(true);
      }),
      catchError((error: unknown) => {
        this.contextState.set(null);
        this.loadedState.set(false);
        this.errorState.set(CONTEXT_LOAD_ERROR);
        return throwError(() => error);
      }),
      finalize(() => {
        this.loadingState.set(false);
        this.contextRequest$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.contextRequest$;
  }

  reloadContext(): Observable<AuthContext> {
    this.clearContext();
    return this.loadContext();
  }

  selectRole(codr: number): void {
    if (this.roles().some((role) => role.codr === codr)) {
      this.selectedRoleIdState.set(codr);
    }
  }

  clearContext(): void {
    this.contextState.set(null);
    this.loadingState.set(false);
    this.loadedState.set(false);
    this.errorState.set(null);
    this.selectedRoleIdState.set(null);
  }
}
