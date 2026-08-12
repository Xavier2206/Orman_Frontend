import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
  withXsrfConfiguration,
} from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { authInterceptor } from './auth.interceptor';
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

describe('AuthService and authInterceptor', () => {
  let auth: AuthService;
  let client: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; Path=/';
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([authInterceptor]),
          withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
        ),
        provideHttpClientTesting(),
      ],
    });
    auth = TestBed.inject(AuthService);
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    auth.clearSession();
    localStorage.clear();
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; Path=/';
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

  it('should login with a stable WEB device and keep the access token only in memory', () => {
    auth.login('usuario.demo', 'password-demo').subscribe();

    const request = http.expectOne('/api/v1/auth/login');
    expect(request.request.headers.has('Authorization')).toBe(false);
    expect(request.request.body).toMatchObject({
      login: 'usuario.demo',
      password: 'password-demo',
      clientType: 'WEB',
      deviceId: expect.any(String),
      deviceName: expect.any(String),
    });
    request.flush(authenticatedResponse);

    expect(auth.authenticated()).toBe(true);
    expect(auth.accessToken()).toBe('initial-token');
    expect(auth.loginName()).toBe('usuario.demo');
    expect(auth.codper()).toBe(10);
    expect(auth.sid()).toBe('session-id');
    expect(auth.expiresIn()).toBe(900);
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem(DEVICE_ID_STORAGE_KEY)).toBeTruthy();
  });

  it('should retain OTP_REQUIRED only as temporary challenge state', () => {
    auth.login('usuario.demo', 'password-demo').subscribe();
    http.expectOne('/api/v1/auth/login').flush({
      status: 'OTP_REQUIRED',
      challengeId: 'challenge-id',
      expiresIn: 300,
    });

    expect(auth.authenticated()).toBe(false);
    expect(auth.otpChallenge()).toEqual({ challengeId: 'challenge-id', expiresIn: 300 });
    expect(localStorage.getItem('challengeId')).toBeNull();
  });

  it('should verify and resend an OTP without Bearer', () => {
    auth.login('usuario.demo', 'password-demo').subscribe();
    http.expectOne('/api/v1/auth/login').flush({
      status: 'OTP_REQUIRED',
      challengeId: 'challenge-id',
      expiresIn: 300,
    });

    auth.resendOtp().subscribe();
    const resend = http.expectOne('/api/v1/auth/otp/resend');
    expect(resend.request.headers.has('Authorization')).toBe(false);
    resend.flush(null, { status: 204, statusText: 'No Content' });

    auth.verifyOtp('123456').subscribe();
    const verify = http.expectOne('/api/v1/auth/otp/verify');
    expect(verify.request.headers.has('Authorization')).toBe(false);
    expect(verify.request.body).toMatchObject({ challengeId: 'challenge-id', code: '123456' });
    verify.flush(authenticatedResponse);

    expect(auth.authenticated()).toBe(true);
    expect(auth.otpChallenge()).toBeNull();
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

  it('should use the standard XSRF cookie and header for refresh without Bearer', () => {
    document.cookie = 'XSRF-TOKEN=csrf-token; Path=/';

    auth.refreshAccessToken().subscribe();
    const refresh = http.expectOne('/api/v1/auth/refresh');
    expect(refresh.request.headers.has('Authorization')).toBe(false);
    expect(refresh.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-token');
    refresh.flush(refreshedResponse);

    expect(auth.accessToken()).toBe('refreshed-token');
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
    refresh.flush(refreshedResponse);

    const retry = http.expectOne('/api/v1/protected-resource');
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
    expect(retries.every((request) => request.request.headers.get('Authorization') === 'Bearer refreshed-token')).toBe(true);
    retries.forEach((request) => request.flush({ ok: true }));
  });

  it('should not refresh a retry again and should clear the session after refresh failure', () => {
    authenticate();
    let requestError: HttpErrorResponse | undefined;
    client.get('/api/v1/protected-resource').subscribe({ error: (error) => (requestError = error) });
    expire(http.expectOne('/api/v1/protected-resource'));
    expire(http.expectOne('/api/v1/auth/refresh'), 'SESSION_EXPIRED');

    expect(auth.authenticated()).toBe(false);
    expect(requestError?.status).toBe(401);
    expect(http.match('/api/v1/auth/refresh')).toHaveLength(0);
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
