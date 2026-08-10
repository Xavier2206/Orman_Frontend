import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginModalComponent } from './login-modal.component';

describe('LoginModalComponent', () => {
  let fixture: ComponentFixture<LoginModalComponent>;

  beforeEach(async () => {
    document.body.style.overflow = '';
    await TestBed.configureTestingModule({ imports: [LoginModalComponent] }).compileComponents();
    fixture = TestBed.createComponent(LoginModalComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    document.body.style.overflow = '';
  });

  function clickButton(label: string): void {
    const button = [...fixture.nativeElement.querySelectorAll('button')].find(
      (candidate: HTMLButtonElement) => candidate.textContent?.trim() === label,
    ) as HTMLButtonElement | undefined;

    button?.click();
    fixture.detectChanges();
  }

  it('should create directly with the credentials form', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Iniciar sesión');
    expect(fixture.nativeElement.textContent).toContain('Accede a tu cuenta ORMAN.');
    expect(fixture.nativeElement.textContent).not.toContain('Acceso a ORMAN');
    expect(fixture.nativeElement.querySelector('#login-username')).toBeTruthy();
  });

  it('should expose a modal dialog, overlay and official logo', () => {
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    const logo = fixture.nativeElement.querySelector('img') as HTMLImageElement;

    expect(fixture.nativeElement.querySelector('.login-modal-overlay')).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('login-modal-title');
    expect(dialog.getAttribute('aria-describedby')).toBe('login-modal-description');
    expect(logo.getAttribute('src')).toBe('/images/brand/orman-logo.svg');
    expect(logo.getAttribute('alt')).toBe('ORMAN');
  });

  it('should focus the username field when opened', async () => {
    await fixture.whenStable();
    const username = fixture.nativeElement.querySelector('#login-username') as HTMLInputElement;

    expect(document.activeElement).toBe(username);
  });

  it('should emit close from Cancel', () => {
    const close = vi.fn();
    fixture.componentInstance.close.subscribe(close);

    clickButton('Cancelar');

    expect(close).toHaveBeenCalledOnce();
  });

  it('should emit close from the close button', () => {
    const close = vi.fn();
    fixture.componentInstance.close.subscribe(close);

    const closeButton = fixture.nativeElement.querySelector(
      '[aria-label="Cerrar inicio de sesión"]',
    ) as HTMLButtonElement;
    closeButton.click();

    expect(close).toHaveBeenCalledOnce();
  });

  it('should close with Escape', () => {
    const close = vi.fn();
    fixture.componentInstance.close.subscribe(close);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(close).toHaveBeenCalledOnce();
  });

  it('should close from the overlay but not from the dialog panel', () => {
    const close = vi.fn();
    fixture.componentInstance.close.subscribe(close);
    const overlay = fixture.nativeElement.querySelector('.login-modal-overlay') as HTMLElement;
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;

    dialog.click();
    expect(close).not.toHaveBeenCalled();

    overlay.click();
    expect(close).toHaveBeenCalledOnce();
  });

  it('should keep Tab focus inside the modal dialog', () => {
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    const firstButton = dialog.querySelector('button') as HTMLButtonElement;
    const submitButton = dialog.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitButton.focus();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

    expect(document.activeElement).toBe(firstButton);
  });

  it('should show and hide the password', () => {
    const password = fixture.nativeElement.querySelector('#login-password') as HTMLInputElement;
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
    clickButton('Iniciar sesión');

    expect(fixture.nativeElement.textContent).toContain('Ingresa tu usuario o correo.');
    expect(fixture.nativeElement.textContent).toContain('Ingresa tu contraseña.');
    expect(
      (fixture.nativeElement.querySelector('#login-username') as HTMLElement).classList.contains(
        'field-error',
      ),
    ).toBe(true);
    expect(
      (fixture.nativeElement.querySelector('#login-password') as HTMLElement).classList.contains(
        'field-error',
      ),
    ).toBe(true);
  });

  it('should keep an empty focused field neutral until it is touched', () => {
    const username = fixture.nativeElement.querySelector('#login-username') as HTMLInputElement;

    username.focus();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement.querySelector('#login-username') as HTMLElement).classList.contains(
        'field-error',
      ),
    ).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('Ingresa tu usuario o correo.');
  });

  it('should show an error after an empty field is touched', () => {
    const username = fixture.nativeElement.querySelector('#login-username') as HTMLInputElement;

    username.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(
      (fixture.nativeElement.querySelector('#login-username') as HTMLElement).classList.contains(
        'field-error',
      ),
    ).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Ingresa tu usuario o correo.');
  });

  it('should show a valid visual state after interaction and clear an error when corrected', () => {
    const username = fixture.nativeElement.querySelector('#login-username') as HTMLInputElement;

    username.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    username.value = 'usuario';
    username.dispatchEvent(new Event('input'));
    username.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(
      (fixture.nativeElement.querySelector('#login-username') as HTMLElement).classList.contains(
        'field-valid',
      ),
    ).toBe(true);
    expect(
      (fixture.nativeElement.querySelector('#login-username') as HTMLElement).classList.contains(
        'field-error',
      ),
    ).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('Ingresa tu usuario o correo.');
  });

  it('should only show the local information message for valid visual fields', () => {
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

  it('should reset local form state when closing', () => {
    const username = fixture.nativeElement.querySelector('#login-username') as HTMLInputElement;
    const password = fixture.nativeElement.querySelector('#login-password') as HTMLInputElement;
    username.value = 'usuario';
    username.dispatchEvent(new Event('input'));
    password.value = 'clave-local';
    password.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector(
      '[aria-label="Mostrar contraseña"]',
    ) as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    clickButton('Iniciar sesión');
    clickButton('Cancelar');

    expect(username.value).toBe('');
    expect(password.value).toBe('');
    expect(fixture.nativeElement.textContent).not.toContain(
      'El acceso al sistema estará disponible próximamente.',
    );
    expect(
      fixture.nativeElement.querySelector('[aria-label="Mostrar contraseña"]'),
    ).toBeTruthy();
  });

  it('should lock and restore document scrolling', () => {
    expect(document.body.style.overflow).toBe('hidden');

    fixture.destroy();

    expect(document.body.style.overflow).toBe('');
  });
});
