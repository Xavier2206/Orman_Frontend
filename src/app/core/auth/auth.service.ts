import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';

import { XSRF_HEADER_NAME, apiPath } from '../api/api.constants';
import { CsrfTokenService } from '../api/csrf-token.service';
import {
  AuthSession,
  AuthState,
  AuthenticatedResponse,
  LoginRequest,
  LoginResponse,
} from './auth.model';
import { DeviceService } from './device.service';

const AUTH_PATH = apiPath('/auth');

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly device = inject(DeviceService);
  private readonly csrf = inject(CsrfTokenService);
  private readonly sessionState = signal<AuthSession | null>(null);
  private readonly authState = signal<AuthState>('checking');
  private refreshRequest$: Observable<void> | null = null;
  private sessionClearHandler: (() => void) | null = null;

  readonly session = this.sessionState.asReadonly();
  readonly state = this.authState.asReadonly();
  readonly authenticated = computed(() => this.sessionState() !== null);
  readonly accessToken = computed(() => this.sessionState()?.accessToken ?? null);
  readonly loginName = computed(() => this.sessionState()?.login ?? null);
  readonly codper = computed(() => this.sessionState()?.codper ?? null);
  readonly sid = computed(() => this.sessionState()?.sid ?? null);
  readonly expiresIn = computed(() => this.sessionState()?.expiresIn ?? null);

  login(login: string, password: string): Observable<LoginResponse> {
    const request: LoginRequest = {
      login,
      password,
      deviceId: this.device.getDeviceId(),
      deviceName: this.device.getDeviceName(),
      clientType: 'WEB',
    };

    return this.http
      .post<LoginResponse>(`${AUTH_PATH}/login`, request, {
        observe: 'response',
        withCredentials: true,
      })
      .pipe(
        tap((response) => this.updateCsrfToken(response.headers.get(XSRF_HEADER_NAME))),
        map((response) => {
          if (!response.body) {
            throw new Error('The login response body is missing.');
          }
          return response.body;
        }),
        tap((response) => this.completeAuthentication(response)),
      );
  }

  restoreSession(): Observable<void> {
    if (this.authenticated()) {
      this.authState.set('authenticated');
      return of(undefined);
    }

    this.authState.set('checking');
    return this.refreshAccessToken().pipe(catchError(() => of(undefined)));
  }

  refreshAccessToken(): Observable<void> {
    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    this.refreshRequest$ = this.http
      .post<AuthenticatedResponse>(`${AUTH_PATH}/refresh`, null, {
        observe: 'response',
        withCredentials: true,
      })
      .pipe(
        tap((response) => this.updateCsrfToken(response.headers.get(XSRF_HEADER_NAME))),
        map((response) => {
          if (!response.body) {
            throw new Error('The refresh response body is missing.');
          }
          this.completeAuthentication(response.body);
        }),
        map(() => undefined),
        catchError((error: unknown) => {
          this.clearSession();
          return throwError(() => error);
        }),
        finalize(() => {
          this.refreshRequest$ = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.refreshRequest$;
  }

  getAccessTokenAfterPendingRefresh(): Observable<string | null> {
    const pendingRefresh = this.refreshRequest$;

    if (!pendingRefresh) {
      return of(this.accessToken());
    }

    return pendingRefresh.pipe(
      map(() => this.accessToken()),
      catchError(() => of(null)),
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${AUTH_PATH}/logout`, null, { withCredentials: true }).pipe(
      tap(() => this.clearSession()),
      catchError((error: unknown) => {
        this.clearSession();
        return throwError(() => error);
      }),
    );
  }

  logoutAll(): Observable<void> {
    return this.http.post<void>(`${AUTH_PATH}/logout-all`, null, { withCredentials: true }).pipe(
      tap(() => this.clearSession()),
      catchError((error: unknown) => {
        this.clearSession();
        return throwError(() => error);
      }),
    );
  }

  registerSessionClearHandler(handler: () => void): void {
    this.sessionClearHandler = handler;
  }

  clearSession(): void {
    this.sessionState.set(null);
    this.authState.set('unauthenticated');
    this.sessionClearHandler?.();
  }

  private completeAuthentication(response: AuthenticatedResponse): void {
    this.sessionState.set({
      login: response.login,
      codper: response.codper,
      accessToken: response.accessToken,
      expiresIn: response.expiresIn,
      sid: response.sid,
    });
    this.authState.set('authenticated');
  }

  private updateCsrfToken(token: string | null): void {
    if (token) {
      this.csrf.setToken(token);
    }
  }
}
