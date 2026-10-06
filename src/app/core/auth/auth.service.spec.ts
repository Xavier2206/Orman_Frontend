import {
  HttpClient,
  HttpContext,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
  withXsrfConfiguration,
} from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../api/api.constants';
import { CsrfTokenService } from '../api/csrf-token.service';
import { ormanXsrfInterceptor, XSRF_HEADER_NAME } from '../api/xsrf.interceptor';
import { authInterceptor } from './auth.interceptor';
import { SKIP_AUTH_INTERCEPTOR } from './auth-http-context';
import { AuthService } from './auth.service';
import { DEVICE_ID_STORAGE_KEY } from './device.service';

const authenticatedResponse = {
  status: 'AUTHENTICATED' as const,
  login: 'usuario.demo',
  codper: 10,
  accessToken: 'initial-token',
  tokenType: 'Bearer' as const,
  expiresIn: 900,
  sid: 'session-id',
};

const refreshedResponse = {
  ...authenticatedResponse,
  accessToken: 'refreshed-token',
};

const tokenExpired = { errorCode: 'TOKEN_EXPIRED', detail: 'El token expiró.' };
const productionApiBaseUrl = 'https://orman-backend-e09w.onrender.com/api/v1';

describe('AuthService and authInterceptor', () => {
  let auth: AuthService;
  let csrf: CsrfTokenService;
  let client: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        { provide: API_BASE_URL, useValue: productionApiBaseUrl },
        provideHttpClient(
          withInterceptors([authInterceptor, ormanXsrfInterceptor]),
          withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
        ),
        provideHttpClientTesting(),
      ],
    });
    auth = TestBed.inject(AuthService);
    csrf = TestBed.inject(CsrfTokenService);
    csrf.setToken('csrf-token');
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    auth.clearSession();
    csrf.clear();
    localStorage.clear();
  });

  function authenticate(): void {
    auth.login('usuario.demo', 'password-demo').subscribe();
    const request = http.expectOne('/api/v1/auth/login');
    request.flush(authenticatedResponse);
  }

  function expire(request: TestRequest, errorCode = 'TOKEN_EXPIRED'): void {
    request.flush(
      { errorCode, detail: 'Error de autenticación.' },
      { status: 401, statusText: 'Unauthorized' },
    );
  }

  it('should login with credentials and keep the access token only in memory', () => {
    auth.login('usuario.demo', 'password-demo').subscribe();

    const request = http.expectOne('/api/v1/auth/login');
    expect(request.request.headers.has('Authorization')).toBe(false);
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.get(XSRF_HEADER_NAME)).toBe('csrf-token');
    expect(request.request.body).toMatchObject({
      login: 'usuario.demo',
      password: 'password-demo',
      clientType: 'WEB',
      deviceId: expect.any(String),
      deviceName: expect.any(String),
    });
    request.flush(authenticatedResponse, {
      headers: { [XSRF_HEADER_NAME]: 'login-response-csrf-token' },
    });

    expect(auth.authenticated()).toBe(true);
    expect(auth.accessToken()).toBe('initial-token');
    expect(auth.loginName()).toBe('usuario.demo');
    expect(auth.codper()).toBe(10);
    expect(auth.sid()).toBe('session-id');
    expect(auth.expiresIn()).toBe(900);
    expect(csrf.getToken()).toBe('login-response-csrf-token');
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem(DEVICE_ID_STORAGE_KEY)).toBeTruthy();
  });

  it('should include XSRF on login sent to the absolute ORMAN API', () => {
    authenticate();
    const loginUrl = `${productionApiBaseUrl}/auth/login`;

    client.post(loginUrl, null, { withCredentials: true }).subscribe();
    const login = http.expectOne(loginUrl);

    expect(login.request.withCredentials).toBe(true);
    expect(login.request.headers.get(XSRF_HEADER_NAME)).toBe('csrf-token');
    expect(login.request.headers.has('Authorization')).toBe(false);
    login.flush(authenticatedResponse);
  });

  it('should add Bearer only to authenticated non-auth requests', () => {
    authenticate();

    client.get('/api/v1/protected-resource').subscribe();
    const protectedRequest = http.expectOne('/api/v1/protected-resource');
    expect(protectedRequest.request.headers.get('Authorization')).toBe('Bearer initial-token');
    protectedRequest.flush({});

    auth.login('otro', 'password-demo').subscribe();
    const loginRequest = http.expectOne('/api/v1/auth/login');
    expect(loginRequest.request.headers.has('Authorization')).toBe(false);
    loginRequest.flush(authenticatedResponse);
  });

  it('should omit Bearer for relative and absolute login and refresh endpoints', () => {
    authenticate();
    const authEndpoints = [
      '/api/v1/auth/login',
      '/api/v1/auth/refresh',
      `${productionApiBaseUrl}/auth/login`,
      `${productionApiBaseUrl}/auth/refresh`,
    ];

    authEndpoints.forEach((url) => client.post(url, null).subscribe());

    const requests = http.match((request) => authEndpoints.includes(request.url));
    expect(requests).toHaveLength(authEndpoints.length);
    expect(requests.every((request) => !request.request.headers.has('Authorization'))).toBe(true);
    requests.forEach((request) => request.flush({}));
  });

  it('should add Bearer to an absolute protected endpoint', () => {
    authenticate();

    client.get(`${productionApiBaseUrl}/protected-resource`).subscribe();
    const request = http.expectOne(`${productionApiBaseUrl}/protected-resource`);

    expect(request.request.headers.get('Authorization')).toBe('Bearer initial-token');
    request.flush({});
  });

  it('should not send the access token to external service requests marked to skip auth', () => {
    authenticate();

    client
      .get('https://nominatim.openstreetmap.org/search', {
        context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true),
      })
      .subscribe();
    const externalRequest = http.expectOne('https://nominatim.openstreetmap.org/search');

    expect(externalRequest.request.headers.has('Authorization')).toBe(false);
    externalRequest.flush([]);
  });

  it('should use the in-memory XSRF token for refresh without Bearer', () => {
    auth.refreshAccessToken().subscribe();
    const refresh = http.expectOne('/api/v1/auth/refresh');
    expect(refresh.request.headers.has('Authorization')).toBe(false);
    expect(refresh.request.withCredentials).toBe(true);
    expect(refresh.request.headers.get(XSRF_HEADER_NAME)).toBe('csrf-token');
    refresh.flush(refreshedResponse);

    expect(auth.accessToken()).toBe('refreshed-token');
  });

  it('should attach the readable XSRF token and credentials to an absolute ORMAN refresh URL', () => {
    const refreshUrl = `${productionApiBaseUrl}/auth/refresh`;

    client.post(refreshUrl, null, { withCredentials: true }).subscribe();
    const refresh = http.expectOne(refreshUrl);

    expect(refresh.request.withCredentials).toBe(true);
    expect(refresh.request.headers.get(XSRF_HEADER_NAME)).toBe('csrf-token');
    expect(refresh.request.headers.has('Authorization')).toBe(false);
    refresh.flush(refreshedResponse);
  });

  it('should not attach the ORMAN XSRF token to an external service', () => {
    client
      .post('https://nominatim.openstreetmap.org/search', null, {
        context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true),
      })
      .subscribe();
    const externalRequest = http.expectOne('https://nominatim.openstreetmap.org/search');

    expect(externalRequest.request.headers.has(XSRF_HEADER_NAME)).toBe(false);
    expect(externalRequest.request.withCredentials).toBe(false);
    externalRequest.flush({});
  });

  it('should not trust another host even when it uses the ORMAN API path', () => {
    const untrustedUrl = 'https://attacker.example/api/v1/auth/refresh';

    client.post(untrustedUrl, null, { withCredentials: true }).subscribe();
    const request = http.expectOne(untrustedUrl);

    expect(request.request.headers.has(XSRF_HEADER_NAME)).toBe(false);
    request.flush({});
  });

  it('should wait for an existing refresh before returning the current access token', () => {
    authenticate();
    let currentToken: string | null | undefined;
    auth.refreshAccessToken().subscribe();
    const refresh = http.expectOne('/api/v1/auth/refresh');

    auth.getAccessTokenAfterPendingRefresh().subscribe((accessToken) => {
      currentToken = accessToken;
    });

    expect(currentToken).toBeUndefined();
    refresh.flush(refreshedResponse);

    expect(currentToken).toBe('refreshed-token');
    expect(http.match('/api/v1/auth/refresh')).toHaveLength(0);
  });

  it('should restore the session during bootstrap when refresh succeeds', () => {
    auth.restoreSession().subscribe();
    http.expectOne('/api/v1/auth/refresh').flush(refreshedResponse);

    expect(auth.state()).toBe('authenticated');
    expect(auth.loginName()).toBe('usuario.demo');
    expect(auth.accessToken()).toBe('refreshed-token');
  });

  it('should finish bootstrap unauthenticated when refresh fails without looping', () => {
    auth.restoreSession().subscribe();
    expire(http.expectOne('/api/v1/auth/refresh'), 'SESSION_EXPIRED');

    expect(auth.state()).toBe('unauthenticated');
    expect(auth.authenticated()).toBe(false);
    expect(http.match('/api/v1/auth/refresh')).toHaveLength(0);
  });

  it('should refresh once and retry the original request once after TOKEN_EXPIRED', () => {
    authenticate();
    let received: unknown;
    client.get('/api/v1/protected-resource').subscribe((response) => (received = response));
    expire(http.expectOne('/api/v1/protected-resource'));

    const refresh = http.expectOne('/api/v1/auth/refresh');
    expect(refresh.request.withCredentials).toBe(true);
    expect(refresh.request.headers.get(XSRF_HEADER_NAME)).toBe('csrf-token');
    refresh.flush(refreshedResponse);

    const retry = http.expectOne('/api/v1/protected-resource');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer refreshed-token');
    retry.flush({ ok: true });

    expect(received).toEqual({ ok: true });
  });

  it('should refresh once and retry an absolute protected request with the new token', () => {
    authenticate();
    let received: unknown;
    const protectedUrl = `${productionApiBaseUrl}/protected-resource`;

    client.get(protectedUrl).subscribe((response) => (received = response));
    expire(http.expectOne(protectedUrl));

    const refresh = http.expectOne('/api/v1/auth/refresh');
    expect(refresh.request.withCredentials).toBe(true);
    expect(refresh.request.headers.get(XSRF_HEADER_NAME)).toBe('csrf-token');
    expect(refresh.request.headers.has('Authorization')).toBe(false);
    refresh.flush(refreshedResponse);

    const retry = http.expectOne(protectedUrl);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer refreshed-token');
    retry.flush({ ok: true });

    expect(received).toEqual({ ok: true });
  });

  it('should not refresh again when the one allowed retry also expires', () => {
    authenticate();
    client.get('/api/v1/protected-resource').subscribe({ error: () => undefined });
    expire(http.expectOne('/api/v1/protected-resource'));
    http.expectOne('/api/v1/auth/refresh').flush(refreshedResponse);
    expire(http.expectOne('/api/v1/protected-resource'));

    expect(http.match('/api/v1/auth/refresh')).toHaveLength(0);
  });

  it('should use one single-flight refresh for concurrent TOKEN_EXPIRED requests', () => {
    authenticate();
    client.get('/api/v1/first').subscribe();
    client.get('/api/v1/second').subscribe();
    expire(http.expectOne('/api/v1/first'));
    expire(http.expectOne('/api/v1/second'));

    const refreshRequests = http.match('/api/v1/auth/refresh');
    expect(refreshRequests).toHaveLength(1);
    refreshRequests[0].flush(refreshedResponse);

    const retries = http.match((request) =>
      ['/api/v1/first', '/api/v1/second'].includes(request.url),
    );
    expect(retries).toHaveLength(2);
    expect(
      retries.every(
        (request) => request.request.headers.get('Authorization') === 'Bearer refreshed-token',
      ),
    ).toBe(true);
    retries.forEach((request) => request.flush({ ok: true }));
  });

  it('should not refresh a retry again and should clear the session after refresh failure', () => {
    authenticate();
    let requestError: HttpErrorResponse | undefined;
    client
      .get('/api/v1/protected-resource')
      .subscribe({ error: (error) => (requestError = error) });
    expire(http.expectOne('/api/v1/protected-resource'));
    expire(http.expectOne('/api/v1/auth/refresh'), 'SESSION_EXPIRED');

    expect(auth.authenticated()).toBe(false);
    expect(requestError?.status).toBe(401);
    expect(http.match('/api/v1/auth/refresh')).toHaveLength(0);
  });

  it('should not recursively refresh or send Bearer when an absolute refresh fails', () => {
    authenticate();
    let requestError: HttpErrorResponse | undefined;
    const refreshUrl = `${productionApiBaseUrl}/auth/refresh`;

    client
      .post(refreshUrl, null, { withCredentials: true })
      .subscribe({ error: (error) => (requestError = error) });
    const refresh = http.expectOne(refreshUrl);
    expect(refresh.request.withCredentials).toBe(true);
    expect(refresh.request.headers.get(XSRF_HEADER_NAME)).toBe('csrf-token');
    expect(refresh.request.headers.has('Authorization')).toBe(false);
    expire(refresh, 'SESSION_EXPIRED');

    expect(requestError?.status).toBe(401);
    expect(auth.authenticated()).toBe(false);
    expect(http.match('/api/v1/auth/refresh')).toHaveLength(0);
    expect(http.match(refreshUrl)).toHaveLength(0);
  });

  it('should not recursively refresh when an absolute refresh returns TOKEN_EXPIRED', () => {
    authenticate();
    const refreshUrl = `${productionApiBaseUrl}/auth/refresh`;

    client.post(refreshUrl, null, { withCredentials: true }).subscribe({ error: () => undefined });
    const refresh = http.expectOne(refreshUrl);
    expect(refresh.request.withCredentials).toBe(true);
    expect(refresh.request.headers.get(XSRF_HEADER_NAME)).toBe('csrf-token');
    expect(refresh.request.headers.has('Authorization')).toBe(false);
    expire(refresh);

    expect(http.match('/api/v1/auth/refresh')).toHaveLength(0);
    expect(http.match(refreshUrl)).toHaveLength(0);
  });

  it('should clear the session directly for SESSION_REVOKED and SESSION_EXPIRED', () => {
    authenticate();
    client.get('/api/v1/protected-resource').subscribe({ error: () => undefined });
    expire(http.expectOne('/api/v1/protected-resource'), 'SESSION_REVOKED');

    expect(auth.authenticated()).toBe(false);
  });

  it('should logout with Bearer, clear only memory state and preserve deviceId', () => {
    authenticate();
    const deviceId = localStorage.getItem(DEVICE_ID_STORAGE_KEY);

    auth.logout().subscribe();
    const request = http.expectOne('/api/v1/auth/logout');
    expect(request.request.headers.get('Authorization')).toBe('Bearer initial-token');
    request.flush(null, { status: 204, statusText: 'No Content' });

    expect(auth.authenticated()).toBe(false);
    expect(localStorage.getItem(DEVICE_ID_STORAGE_KEY)).toBe(deviceId);
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('should expose no token persistence after an authentication lifecycle', () => {
    authenticate();
    auth.clearSession();

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('orman_refresh')).toBeNull();
  });
});
