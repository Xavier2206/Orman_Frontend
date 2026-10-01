import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthContextService } from '../../../core/auth/auth-context.service';
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
  roles: [{ codr: 1, nombre: 'PROPIETARIO', menus: [] }],
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
    expect(fixture.nativeElement.textContent).toContain(
      'La contraseña debe tener entre 8 y 72 caracteres.',
    );
  });

  it('should authenticate a WEB owner directly and load context without a second step', () => {
    const authenticated = vi.fn();
    fixture.componentInstance.authenticated.subscribe(authenticated);
    fillLogin();
    clickButton('Iniciar sesión');

    const request = http.expectOne('/api/v1/auth/login');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toMatchObject({
      login: 'usuario.demo',
      password: 'password-demo',
      clientType: 'WEB',
    });
    request.flush(authenticatedResponse);
    flushContext();

    expect(authenticated).toHaveBeenCalledOnce();
    expect(auth.authenticated()).toBe(true);
    expect(TestBed.inject(AuthContextService).selectedRole()?.nombre).toBe('PROPIETARIO');
    expect(fixture.nativeElement.querySelectorAll('input')).toHaveLength(2);
    expect(localStorage.getItem('accessToken')).toBeNull();
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
