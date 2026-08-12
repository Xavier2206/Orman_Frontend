import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';

import { apiPath } from '../api/api.constants';
import {
  AuthSession,
  AuthState,
  AuthenticatedResponse,
  LoginRequest,
  LoginResponse,
  OtpChallenge,
  OtpResendRequest,
  OtpVerifyRequest,
} from './auth.model';
import { DeviceService } from './device.service';

const AUTH_PATH = apiPath('/auth');

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly device = inject(DeviceService);
  private readonly sessionState = signal<AuthSession | null>(null);
  private readonly authState = signal<AuthState>('checking');
  private readonly otpChallengeState = signal<OtpChallenge | null>(null);
  private refreshRequest$: Observable<void> | null = null;

  readonly session = this.sessionState.asReadonly();
  readonly state = this.authState.asReadonly();
  readonly otpChallenge = this.otpChallengeState.asReadonly();
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
      .post<LoginResponse>(`${AUTH_PATH}/login`, request, { withCredentials: true })
      .pipe(tap((response) => this.handleLoginResponse(response)));
  }

  restoreSession(): Observable<void> {
    if (this.authenticated()) {
      this.authState.set('authenticated');
      return of(undefined);
    }

    this.authState.set('checking');
    return this.refreshAccessToken().pipe(catchError(() => of(undefined)));
  }

  verifyOtp(code: string): Observable<AuthenticatedResponse> {
    const challenge = this.otpChallengeState();

    if (!challenge) {
      return throwError(() => new Error('No hay un desafío OTP activo.'));
    }

    const request: OtpVerifyRequest = {
      challengeId: challenge.challengeId,
      code,
      deviceId: this.device.getDeviceId(),
      deviceName: this.device.getDeviceName(),
    };

    return this.http
      .post<AuthenticatedResponse>(`${AUTH_PATH}/otp/verify`, request, { withCredentials: true })
      .pipe(tap((response) => this.completeAuthentication(response)));
  }

  resendOtp(): Observable<void> {
    const challenge = this.otpChallengeState();

    if (!challenge) {
      return throwError(() => new Error('No hay un desafío OTP activo.'));
    }

    const request: OtpResendRequest = { challengeId: challenge.challengeId };

    return this.http.post<void>(`${AUTH_PATH}/otp/resend`, request, { withCredentials: true });
  }

  refreshAccessToken(): Observable<void> {
    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    this.refreshRequest$ = this.http
      .post<AuthenticatedResponse>(`${AUTH_PATH}/refresh`, null, { withCredentials: true })
      .pipe(
        tap((response) => this.completeAuthentication(response)),
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

  clearOtpChallenge(): void {
    this.otpChallengeState.set(null);
  }

  clearSession(): void {
    this.sessionState.set(null);
    this.authState.set('unauthenticated');
    this.clearOtpChallenge();
  }

  private handleLoginResponse(response: LoginResponse): void {
    if (response.status === 'AUTHENTICATED') {
      this.completeAuthentication(response);
      return;
    }

    this.otpChallengeState.set({
      challengeId: response.challengeId,
      expiresIn: response.expiresIn,
    });
    this.authState.set('unauthenticated');
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
    this.clearOtpChallenge();
  }
}
