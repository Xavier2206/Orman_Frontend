import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthService } from '../../../core/auth/auth.service';
import { LoginModalComponent } from './login-modal.component';

const authenticatedResponse = {
  status: 'AUTHENTICATED' as const,
  login: 'usuario.demo',
  codper: 10,
  accessToken: 'access-token',
  tokenType: 'Bearer' as const,
  expiresIn: 900,
  sid: 'session-id',
};

describe('LoginModalComponent', () => {
  let fixture: ComponentFixture<LoginModalComponent>;
  let http: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    localStorage.clear();
    document.body.style.overflow = '';
    await TestBed.configureTestingModule({
      imports: [LoginModalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    fixture = TestBed.createComponent(LoginModalComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    fixture.destroy();
    localStorage.clear();
    document.body.style.overflow = '';
  });

  function clickButton(label: string): void {
    const button = [...fixture.nativeElement.querySelectorAll('button')].find(
      (candidate: HTMLButtonElement) => candidate.textContent?.trim() === label,
    ) as HTMLButtonElement | undefined;

    button?.click();
    fixture.detectChanges();
  }

  function fillLogin(): void {
    const username = fixture.nativeElement.querySelector('#login-username') as HTMLInputElement;
    const password = fixture.nativeElement.querySelector('#login-password') as HTMLInputElement;
    username.value = 'usuario.demo';
    username.dispatchEvent(new Event('input'));
    password.value = 'password-demo';
    password.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function startOtpFlow(): void {
    fillLogin();
    clickButton('Iniciar sesión');
    http.expectOne('/api/v1/auth/login').flush({
      status: 'OTP_REQUIRED',
      challengeId: 'challenge-id',
      expiresIn: 300,
    });
    fixture.detectChanges();
  }

  it('should render the accessible login dialog with the official logo', async () => {
    await fixture.whenStable();
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    const username = fixture.nativeElement.querySelector('#login-username') as HTMLInputElement;
    const logo = fixture.nativeElement.querySelector('img') as HTMLImageElement;

    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('login-modal-title');
    expect(logo.getAttribute('src')).toBe('/images/brand/orman-logo.svg');
    expect(document.activeElement).toBe(username);
  });

  it('should keep local required-field validation', () => {
    clickButton('Iniciar sesión');

    expect(fixture.nativeElement.textContent).toContain('Ingresa un usuario o correo');
    expect(fixture.nativeElement.textContent).toContain('La contraseña debe tener entre 8 y 72 caracteres.');
  });

  it('should submit credentials and close through the authenticated output', () => {
    const authenticated = vi.fn();
    fixture.componentInstance.authenticated.subscribe(authenticated);
    fillLogin();
    clickButton('Iniciar sesión');

    const request = http.expectOne('/api/v1/auth/login');
    expect(request.request.body).toMatchObject({
      login: 'usuario.demo',
      password: 'password-demo',
      clientType: 'WEB',
    });
    request.flush(authenticatedResponse);

    expect(authenticated).toHaveBeenCalledOnce();
    expect(auth.authenticated()).toBe(true);
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('should change from LOGIN to OTP_REQUIRED in the same dialog', async () => {
    startOtpFlow();
    await fixture.whenStable();

    const otpInput = fixture.nativeElement.querySelector('#otp-code') as HTMLInputElement;
    expect(fixture.nativeElement.textContent).toContain('Verificación de seguridad');
    expect(otpInput).toBeTruthy();
    expect(document.activeElement).toBe(otpInput);
    expect(auth.otpChallenge()?.challengeId).toBe('challenge-id');
  });

  it('should verify the OTP and authenticate', () => {
    const authenticated = vi.fn();
    fixture.componentInstance.authenticated.subscribe(authenticated);
    startOtpFlow();
    const otp = fixture.nativeElement.querySelector('#otp-code') as HTMLInputElement;
    otp.value = '123456';
    otp.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    clickButton('Verificar');

    const request = http.expectOne('/api/v1/auth/otp/verify');
    expect(request.request.body).toMatchObject({ challengeId: 'challenge-id', code: '123456' });
    request.flush(authenticatedResponse);

    expect(authenticated).toHaveBeenCalledOnce();
    expect(auth.authenticated()).toBe(true);
    expect(auth.otpChallenge()).toBeNull();
  });

  it('should show a safe OTP error from ProblemDetail', () => {
    startOtpFlow();
    const otp = fixture.nativeElement.querySelector('#otp-code') as HTMLInputElement;
    otp.value = '123456';
    otp.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    clickButton('Verificar');
    http.expectOne('/api/v1/auth/otp/verify').flush(
      { errorCode: 'INVALID_REQUEST', detail: 'Código incorrecto o vencido.' },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Código incorrecto o vencido.');
    expect(fixture.nativeElement.textContent).not.toContain('traceId');
  });

  it('should resend an OTP without inventing counters', () => {
    startOtpFlow();
    clickButton('Reenviar código');
    const request = http.expectOne('/api/v1/auth/otp/resend');
    expect(request.request.body).toEqual({ challengeId: 'challenge-id' });
    request.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Enviamos un nuevo código de verificación.');
  });

  it('should prevent a double login submit while the request is pending', () => {
    fillLogin();
    clickButton('Iniciar sesión');
    clickButton('Iniciando sesión…');

    expect(http.match('/api/v1/auth/login')).toHaveLength(1);
  });

  it('should preserve Escape, backdrop close and scroll restoration', () => {
    const close = vi.fn();
    fixture.componentInstance.close.subscribe(close);
    expect(document.body.style.overflow).toBe('hidden');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(close).toHaveBeenCalledOnce();
    expect(document.body.style.overflow).toBe('');
  });

  it('should return from OTP to the login form and clear the temporary challenge', () => {
    startOtpFlow();
    clickButton('Volver');

    expect(fixture.nativeElement.querySelector('#login-username')).toBeTruthy();
    expect(auth.otpChallenge()).toBeNull();
  });

  it('should keep password visibility control accessible', () => {
    const password = fixture.nativeElement.querySelector('#login-password') as HTMLInputElement;
    const toggle = fixture.nativeElement.querySelector(
      '[aria-label="Mostrar contraseña"]',
    ) as HTMLButtonElement;

    toggle.click();
    fixture.detectChanges();

    expect(password.type).toBe('text');
    expect(fixture.nativeElement.querySelector('[aria-label="Ocultar contraseña"]')).toBeTruthy();
  });
});
