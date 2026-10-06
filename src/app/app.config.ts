import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { XSRF_COOKIE_NAME, XSRF_HEADER_NAME } from './core/api/api.constants';
import { ormanXsrfInterceptor } from './core/api/xsrf.interceptor';
import { AuthContextService } from './core/auth/auth-context.service';
import { authInterceptor } from './core/auth/auth.interceptor';
import { ThemeService } from './core/theme/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withInterceptors([authInterceptor, ormanXsrfInterceptor]),
      withXsrfConfiguration({
        cookieName: XSRF_COOKIE_NAME,
        headerName: XSRF_HEADER_NAME,
      }),
    ),
    provideRouter(routes),
    provideAppInitializer(() => inject(ThemeService).initializeTheme()),
    provideAppInitializer(() => inject(AuthContextService).restoreContext()),
  ],
};
