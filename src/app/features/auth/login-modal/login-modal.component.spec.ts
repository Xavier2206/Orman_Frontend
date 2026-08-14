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

const authContextResponse = {
  usuario: { login: 'usuario.demo', codper: 10 },
  persona: { nombre: 'Usuario', ap: 'Demo', am: null, foto: null },
  roles: [],
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
    expect(http.match('/api/v1/auth/context')).toHaveLength(0);
    fixture.detectChanges();
  }

  function getOtpInputs(): HTMLInputElement[] {
    return [...fixture.nativeElement.querySelectorAll('input[id^="otp-digit-"]')];
  }

  function fillOtp(code: string): void {
    getOtpInputs().forEach((input, index) => {
      input.value = code[index] ?? '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    fixture.detectChanges();
  }

  function flushContext(): void {
    http.expectOne('/api/v1/auth/context').flush(authContextResponse);
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
    flushContext();

    expect(authenticated).toHaveBeenCalledOnce();
    expect(auth.authenticated()).toBe(true);
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('should change from LOGIN to OTP_REQUIRED in the same dialog', async () => {
    startOtpFlow();
    await fixture.whenStable();

    const otpInputs = getOtpInputs();
    expect(fixture.nativeElement.textContent).toContain('Verificación de seguridad');
    expect(otpInputs).toHaveLength(6);
    expect(otpInputs[0].getAttribute('aria-label')).toBe('Dígito 1 de 6');
    expect(document.activeElement).toBe(otpInputs[0]);
    expect(auth.otpChallenge()?.challengeId).toBe('challenge-id');
  });

  it('should advance through the six OTP inputs as digits are entered', () => {
    startOtpFlow();
    const otpInputs = getOtpInputs();

    otpInputs[0].value = '1';
    otpInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(otpInputs[0].value).toBe('1');
    expect(document.activeElement).toBe(otpInputs[1]);
  });

  it('should move to the previous OTP input and clear it with Backspace', () => {
    startOtpFlow();
    const otpInputs = getOtpInputs();
    otpInputs[0].value = '1';
    otpInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    otpInputs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    fixture.detectChanges();

    expect(otpInputs[0].value).toBe('');
    expect(document.activeElement).toBe(otpInputs[0]);
  });

  it('should distribute a pasted six-digit code and reject non-numeric input', () => {
    startOtpFlow();
    const otpInputs = getOtpInputs();
    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: { getData: () => '12a3456' },
    });

    otpInputs[0].dispatchEvent(pasteEvent);
    fixture.detectChanges();

    expect(getOtpInputs().map((input) => input.value).join('')).toBe('123456');

    const invalidInput = getOtpInputs()[0];
    invalidInput.value = 'x';
    invalidInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(invalidInput.value).toBe('');
  });

  it('should disable Verify for an incomplete code and submit one six-digit string', () => {
    const authenticated = vi.fn();
    fixture.componentInstance.authenticated.subscribe(authenticated);
    startOtpFlow();
    const verifyButton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.trim() === 'Verificar',
    ) as HTMLButtonElement;

    expect(verifyButton.disabled).toBe(true);
    fillOtp('12345');
    expect(verifyButton.disabled).toBe(true);
    fillOtp('123456');
    expect(verifyButton.disabled).toBe(false);
    clickButton('Verificar');

    const request = http.expectOne('/api/v1/auth/otp/verify');
    expect(request.request.body).toMatchObject({ challengeId: 'challenge-id', code: '123456' });
    request.flush(authenticatedResponse);
    flushContext();

    expect(authenticated).toHaveBeenCalledOnce();
    expect(auth.authenticated()).toBe(true);
    expect(auth.otpChallenge()).toBeNull();
  });

  it('should prevent double OTP verification while the request is pending', () => {
    startOtpFlow();
    fillOtp('123456');
    const verifyButton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Verificar'),
    ) as HTMLButtonElement;
    verifyButton.click();
    fixture.detectChanges();
    verifyButton.click();

    expect(http.match('/api/v1/auth/otp/verify')).toHaveLength(1);
  });

  it('should show a safe OTP error from ProblemDetail', () => {
    startOtpFlow();
    fillOtp('123456');
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

  it('should return from OTP to login, clear all digits and restore focus', async () => {
    startOtpFlow();
    fillOtp('123456');
    clickButton('Volver');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#login-username')).toBeTruthy();
    expect(getOtpInputs()).toHaveLength(0);
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#login-username'));
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
