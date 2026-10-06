import { InjectionToken } from '@angular/core';

import { environment } from '../../../environments/environment';

export const API_BASE_PATH = environment.apiBaseUrl;
export const XSRF_COOKIE_NAME = 'XSRF-TOKEN';
export const XSRF_HEADER_NAME = 'X-XSRF-TOKEN';
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => API_BASE_PATH,
});

export function apiPath(path: string): string {
  return `${API_BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;
}

export function apiUrl(path: string, baseUrl: string = API_BASE_PATH): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
}
