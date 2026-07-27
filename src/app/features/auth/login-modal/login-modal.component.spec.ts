import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginModalComponent } from './login-modal.component';

describe('LoginModalComponent', () => {
  let fixture: ComponentFixture<LoginModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LoginModalComponent] }).compileComponents();
    fixture = TestBed.createComponent(LoginModalComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  function clickButton(label: string): void {
    const button = [...fixture.nativeElement.querySelectorAll('button')].find(
      (candidate: HTMLButtonElement) => candidate.textContent?.trim() === label,
    ) as HTMLButtonElement | undefined;

    button?.click();
    fixture.detectChanges();
  }

  function openCredentialsStep(): void {
    clickButton('Conectar');
  }

  it('should create and start on step one', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Acceso a ORMAN');
    expect(fixture.nativeElement.textContent).not.toContain('Accede a tu cuenta ORMAN.');
  });

  it('should move to step two when Connect is selected', () => {
    openCredentialsStep();

    expect(fixture.nativeElement.textContent).toContain('Iniciar sesión');
    expect(fixture.nativeElement.textContent).toContain('Accede a tu cuenta ORMAN.');
  });

  it('should emit close and reset from Cancel', () => {
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    openCredentialsStep();

    clickButton('Cancelar');

    expect(closed).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('Acceso a ORMAN');
  });

  it('should emit close from the close button', () => {
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);

    const closeButton = fixture.nativeElement.querySelector(
      '[aria-label="Cerrar inicio de sesión"]',
    ) as HTMLButtonElement;
    closeButton.click();

    expect(closed).toHaveBeenCalledOnce();
  });

  it('should close with Escape', () => {
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    const overlay = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;

    overlay.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(closed).toHaveBeenCalledOnce();
  });

  it('should close from the overlay but not from the panel', () => {
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    const overlay = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    const panel = overlay.querySelector('section') as HTMLElement;

    panel.click();
    expect(closed).not.toHaveBeenCalled();

    overlay.click();
    expect(closed).toHaveBeenCalledOnce();
  });

  it('should show and hide the password', () => {
    openCredentialsStep();
    const password = fixture.nativeElement.querySelector(
      '#login-password',
    ) as HTMLInputElement;
    const toggle = fixture.nativeElement.querySelector(
      '[aria-label="Mostrar contraseña"]',
    ) as HTMLButtonElement;

    expect(password.type).toBe('password');
    toggle.click();
    fixture.detectChanges();
    expect(password.type).toBe('text');

    const hideToggle = fixture.nativeElement.querySelector(
      '[aria-label="Ocultar contraseña"]',
    ) as HTMLButtonElement;
    hideToggle.click();
    fixture.detectChanges();
    expect(password.type).toBe('password');
  });

  it('should show local required-field validation', () => {
    openCredentialsStep();

    clickButton('Iniciar sesión');

    expect(fixture.nativeElement.textContent).toContain('Ingresa tu usuario o correo.');
    expect(fixture.nativeElement.textContent).toContain('Ingresa tu contraseña.');
  });

  it('should only show the local information message for valid visual fields', () => {
    openCredentialsStep();
    const username = fixture.nativeElement.querySelector('#login-username') as HTMLInputElement;
    const password = fixture.nativeElement.querySelector('#login-password') as HTMLInputElement;

    username.value = 'usuario';
    username.dispatchEvent(new Event('input'));
    password.value = 'clave-local';
    password.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    clickButton('Iniciar sesión');

    expect(fixture.nativeElement.textContent).toContain(
      'El acceso al sistema estará disponible próximamente.',
    );
  });

  it('should expose accessible dialog attributes and the official logo', () => {
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('login-modal-title');
    expect(dialog.getAttribute('aria-describedby')).toBe('login-modal-description');

    openCredentialsStep();
    const logo = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(logo.getAttribute('src')).toBe('/images/brand/orman-logo.svg');
    expect(logo.getAttribute('alt')).toBe('ORMAN');
  });

  it('should lock and restore document scrolling', () => {
    expect(document.body.style.overflow).toBe('hidden');

    fixture.destroy();

    expect(document.body.style.overflow).toBe('');
  });
});
