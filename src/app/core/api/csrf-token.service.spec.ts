import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL, XSRF_HEADER_NAME } from './api.constants';
import { CsrfTokenService } from './csrf-token.service';
import { ormanXsrfInterceptor } from './xsrf.interceptor';
import { authInterceptor } from '../auth/auth.interceptor';
import { AuthService } from '../auth/auth.service';

const productionApiBaseUrl = 'https://orman-backend-e09w.onrender.com/api/v1';

describe('CsrfTokenService', () => {
  let csrf: CsrfTokenService;
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideHttpClient(withInterceptors([authInterceptor, ormanXsrfInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    csrf = TestBed.inject(CsrfTokenService);
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    auth.clearSession();
    csrf.clear();
  });

  it('should bootstrap the relative CSRF endpoint with credentials and store its header in memory', () => {
    let bootstrapResult: boolean | undefined;
    csrf.bootstrap().subscribe((result) => (bootstrapResult = result));

    const request = http.expectOne('/api/v1/auth/csrf');
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush(null, {
      status: 204,
      statusText: 'No Content',
      headers: { [XSRF_HEADER_NAME]: 'memory-only-csrf-token' },
    });

    expect(bootstrapResult).toBe(true);
    expect(csrf.getToken()).toBe('memory-only-csrf-token');
    expect(csrf.token()).toBe('memory-only-csrf-token');
  });

  it('should bootstrap the absolute production CSRF endpoint with credentials', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: API_BASE_URL, useValue: productionApiBaseUrl },
        provideHttpClient(withInterceptors([authInterceptor, ormanXsrfInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    csrf = TestBed.inject(CsrfTokenService);
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);

    let bootstrapResult: boolean | undefined;
    csrf.bootstrap().subscribe((result) => (bootstrapResult = result));

    const request = http.expectOne(`${productionApiBaseUrl}/auth/csrf`);
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush(null, {
      status: 204,
      statusText: 'No Content',
      headers: { [XSRF_HEADER_NAME]: 'production-csrf-token' },
    });

    expect(bootstrapResult).toBe(true);
    expect(csrf.getToken()).toBe('production-csrf-token');
  });

  it('should send the bootstrapped memory token on the subsequent refresh request', () => {
    csrf.bootstrap().subscribe();
    http.expectOne('/api/v1/auth/csrf').flush(null, {
      status: 204,
      statusText: 'No Content',
      headers: { [XSRF_HEADER_NAME]: 'fresh-csrf-token' },
    });

    auth.refreshAccessToken().subscribe();
    const refresh = http.expectOne('/api/v1/auth/refresh');
    expect(refresh.request.withCredentials).toBe(true);
    expect(refresh.request.headers.get(XSRF_HEADER_NAME)).toBe('fresh-csrf-token');
    expect(refresh.request.headers.has('Authorization')).toBe(false);
    refresh.flush({
      status: 'AUTHENTICATED',
      login: 'usuario.demo',
      codper: 10,
      accessToken: 'refreshed-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      sid: 'session-id',
    });

    expect(auth.accessToken()).toBe('refreshed-token');
  });
});
