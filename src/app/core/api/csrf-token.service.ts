import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { API_BASE_URL, XSRF_HEADER_NAME, apiUrl } from './api.constants';
import { SKIP_AUTH_INTERCEPTOR } from '../auth/auth-http-context';

@Injectable({ providedIn: 'root' })
export class CsrfTokenService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly tokenState = signal<string | null>(null);

  readonly token = this.tokenState.asReadonly();

  setToken(token: string): void {
    this.tokenState.set(token || null);
  }

  getToken(): string | null {
    return this.tokenState();
  }

  clear(): void {
    this.tokenState.set(null);
  }

  bootstrap(): Observable<boolean> {
    this.clear();

    return this.http
      .get<void>(apiUrl('/auth/csrf', this.apiBaseUrl), {
        observe: 'response',
        withCredentials: true,
        context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true),
      })
      .pipe(
        map((response) => {
          const token = response.headers.get(XSRF_HEADER_NAME);
          if (!token) {
            throw new Error(`The ${XSRF_HEADER_NAME} response header is missing.`);
          }

          this.setToken(token);
          return true;
        }),
        catchError(() => {
          this.clear();
          return of(false);
        }),
      );
  }
}
