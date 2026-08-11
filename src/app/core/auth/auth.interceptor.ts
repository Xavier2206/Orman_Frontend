import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { isProblemDetail } from '../api/problem-detail.model';
import { AuthService } from './auth.service';

const AUTH_ENDPOINTS_WITHOUT_BEARER = [
  '/api/v1/auth/login',
  '/api/v1/auth/otp/verify',
  '/api/v1/auth/otp/resend',
  '/api/v1/auth/refresh',
] as const;

const RETRIED_AFTER_REFRESH = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const requestPath = request.url.split('?')[0];
  const isAuthEndpointWithoutBearer = AUTH_ENDPOINTS_WITHOUT_BEARER.includes(
    requestPath as (typeof AUTH_ENDPOINTS_WITHOUT_BEARER)[number],
  );
  const token = auth.accessToken();
  const authenticatedRequest =
    token && !isAuthEndpointWithoutBearer
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const problem = isProblemDetail(error.error) ? error.error : null;
      const errorCode = problem?.errorCode;

      if (
        error.status === 401 &&
        errorCode === 'TOKEN_EXPIRED' &&
        token &&
        !isAuthEndpointWithoutBearer &&
        !request.context.get(RETRIED_AFTER_REFRESH)
      ) {
        return auth.refreshAccessToken().pipe(
          switchMap(() => {
            const refreshedToken = auth.accessToken();

            if (!refreshedToken) {
              return throwError(() => error);
            }

            return next(
              request.clone({
                context: request.context.set(RETRIED_AFTER_REFRESH, true),
                setHeaders: { Authorization: `Bearer ${refreshedToken}` },
              }),
            );
          }),
        );
      }

      if (
        error.status === 401 &&
        (errorCode === 'INVALID_TOKEN' ||
          errorCode === 'SESSION_REVOKED' ||
          errorCode === 'SESSION_EXPIRED')
      ) {
        auth.clearSession();
      }

      return throwError(() => error);
    }),
  );
};
