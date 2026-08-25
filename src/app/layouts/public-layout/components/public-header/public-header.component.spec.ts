import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';
import { PublicHeaderComponent } from './public-header.component';

describe('PublicHeaderComponent', () => {
  let fixture: ComponentFixture<PublicHeaderComponent>;
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    document.body.style.overflow = '';
    await TestBed.configureTestingModule({
      imports: [PublicHeaderComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PublicHeaderComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    auth.clearSession();
    fixture.destroy();
    localStorage.clear();
    document.body.style.overflow = '';
  });

  function desktopLoginTrigger(): HTMLButtonElement {
    return fixture.nativeElement.querySelector(
      '[data-login-trigger="desktop"]',
    ) as HTMLButtonElement;
  }

  function clickButtonInside(selector: string, label: string): void {
    const button = [...fixture.nativeElement.querySelectorAll(`${selector} button`)].find(
      (candidate: HTMLButtonElement) => candidate.textContent?.trim() === label,
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
  }

  it('should render the ORMAN brand and navigation', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('ORMAN');
    expect(element.querySelector('nav[aria-label="Navegación principal"]')).toBeTruthy();
    expect(element.textContent).toContain('Propiedades');
    expect(element.textContent).toContain('Cómo funciona');
  });

  it('should render the official logo linked to the landing start', () => {
    const logo = fixture.nativeElement.querySelector(
      'a[href="#inicio"] img',
    ) as HTMLImageElement | null;

    expect(logo).toBeTruthy();
    expect(logo?.getAttribute('src')).toBe('/images/brand/orman-logo.svg');
    expect(logo?.getAttribute('alt')).toBe('ORMAN - Gestión de propiedades');
    expect(logo?.closest('a')?.getAttribute('aria-label')).toBe('Ir al inicio de ORMAN');
  });

  it('should render the theme selector and login action', () => {
    expect(fixture.nativeElement.querySelector('app-theme-selector')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Iniciar sesión');
    expect(
      fixture.nativeElement.querySelector('[aria-label="Abrir inicio de sesión"]'),
    ).toBeTruthy();
  });

  it('should show the minimal authenticated state without inventing a role', () => {
    auth.login('usuario.demo', 'password-demo').subscribe();
    http.expectOne('/api/v1/auth/login').flush({
      status: 'AUTHENTICATED',
      login: 'usuario.demo',
      codper: 10,
      accessToken: 'access-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      sid: 'session-id',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sesión activa: usuario.demo');
    expect(fixture.nativeElement.textContent).toContain('Cerrar sesión');
    expect(fixture.nativeElement.textContent).not.toContain('ADMINISTRADOR');
  });

  it('should navigate to the private start after authentication', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.componentInstance.handleAuthenticated();

    expect(navigate).toHaveBeenCalledWith('/app/inicio');
  });

  it('should open only QuickMenu from the desktop action', () => {
    const trigger = desktopLoginTrigger();

    trigger.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-quick-menu')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-login-modal')).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe('orman-quick-menu');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('should close the mobile menu and open only the mobile QuickMenu', () => {
    const menuButton = fixture.nativeElement.querySelector(
      '[aria-controls="mobile-navigation"]',
    ) as HTMLButtonElement;
    menuButton.click();
    fixture.detectChanges();

    const mobileTrigger = fixture.nativeElement.querySelector(
      '[data-login-trigger="mobile"]',
    ) as HTMLButtonElement;
    mobileTrigger.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#mobile-navigation')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-quick-menu')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.quick-menu-panel-mobile')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-login-modal')).toBeNull();
  });

  it('should close QuickMenu without opening LoginModal', async () => {
    const trigger = desktopLoginTrigger();
    trigger.click();
    fixture.detectChanges();

    clickButtonInside('app-quick-menu', 'Cancelar');
    await Promise.resolve();

    expect(fixture.nativeElement.querySelector('app-quick-menu')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-login-modal')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('should replace QuickMenu with LoginModal after Connect', () => {
    desktopLoginTrigger().click();
    fixture.detectChanges();

    clickButtonInside('app-quick-menu', 'Conectar');

    expect(fixture.nativeElement.querySelector('app-quick-menu')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-login-modal')).toBeTruthy();
  });

  it('should never render QuickMenu and LoginModal simultaneously', () => {
    desktopLoginTrigger().click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('app-quick-menu, app-login-modal')).toHaveLength(
      1,
    );

    clickButtonInside('app-quick-menu', 'Conectar');
    expect(fixture.nativeElement.querySelectorAll('app-quick-menu, app-login-modal')).toHaveLength(
      1,
    );
  });

  it('should close LoginModal and return focus to the desktop trigger', async () => {
    const trigger = desktopLoginTrigger();
    trigger.click();
    fixture.detectChanges();
    clickButtonInside('app-quick-menu', 'Conectar');

    clickButtonInside('app-login-modal', 'Cancelar');
    await Promise.resolve();

    expect(fixture.nativeElement.querySelector('app-login-modal')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('should close QuickMenu with a second desktop trigger click', () => {
    const trigger = desktopLoginTrigger();
    trigger.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-quick-menu')).toBeTruthy();

    trigger.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-quick-menu')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-login-modal')).toBeNull();
  });

  it('should expose the mobile menu state with aria-expanded', () => {
    const button = fixture.nativeElement.querySelector('[aria-controls="mobile-navigation"]');
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('should open and close the mobile menu', () => {
    const button = fixture.nativeElement.querySelector('[aria-controls="mobile-navigation"]');
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('#mobile-navigation')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('app-theme-selector')).toHaveLength(2);

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('#mobile-navigation')).toBeNull();
  });

  it('should close the mobile menu when a navigation option is selected', () => {
    const button = fixture.nativeElement.querySelector('[aria-controls="mobile-navigation"]');
    button.click();
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('#mobile-navigation a[href="#propiedades"]');
    link.click();
    fixture.detectChanges();

    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('#mobile-navigation')).toBeNull();
  });
});
