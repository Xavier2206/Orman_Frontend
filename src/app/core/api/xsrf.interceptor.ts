import { PlatformLocation } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { API_BASE_URL, XSRF_COOKIE_NAME, XSRF_HEADER_NAME } from './api.constants';
import { CsrfTokenService } from './csrf-token.service';

export { XSRF_COOKIE_NAME, XSRF_HEADER_NAME } from './api.constants';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function isOrmanApiRequest(requestUrl: string, pageUrl: string, apiBasePath: string): boolean {
  try {
    const page = new URL(pageUrl);
    const apiBase = new URL(apiBasePath, page);
    const request = new URL(requestUrl, page);
    const apiPath = apiBase.pathname.replace(/\/+$/, '');
    const isApiPath = request.pathname === apiPath || request.pathname.startsWith(`${apiPath}/`);
    const isAbsoluteUrl = /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(requestUrl);

    return isApiPath && (!isAbsoluteUrl || request.origin === apiBase.origin);
  } catch {
    return false;
  }
}

export const ormanXsrfInterceptor: HttpInterceptorFn = (request, next) => {
  if (SAFE_METHODS.has(request.method)) {
    return next(request);
  }

  const pageUrl = inject(PlatformLocation).href;
  if (!isOrmanApiRequest(request.url, pageUrl, inject(API_BASE_URL))) {
    return next(request);
  }

  const token = inject(CsrfTokenService).getToken();
  if (!token) {
    return next(request);
  }

  if (request.headers.get(XSRF_HEADER_NAME) === token) {
    return next(request);
  }

  return next(request.clone({ setHeaders: { [XSRF_HEADER_NAME]: token } }));
};
