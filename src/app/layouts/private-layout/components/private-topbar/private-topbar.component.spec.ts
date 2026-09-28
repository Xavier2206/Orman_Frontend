import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';
import { AuthContextService } from '../../../../core/auth/auth-context.service';
import { authInterceptor } from '../../../../core/auth/auth.interceptor';
import { PrivateTopbarComponent } from './private-topbar.component';

describe('PrivateTopbarComponent', () => {
  let fixture: ComponentFixture<PrivateTopbarComponent>;
  let auth: AuthService;
  let context: AuthContextService;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivateTopbarComponent],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();
    auth = TestBed.inject(AuthService);
    context = TestBed.inject(AuthContextService);
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PrivateTopbarComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    auth.clearSession();
    http.verify();
  });

  function authenticate(): void {
    auth.login('Xavier_Ortega', 'password-demo').subscribe();
    http.expectOne('/api/v1/auth/login').flush({
      status: 'AUTHENTICATED',
      login: 'Xavier_Ortega',
      codper: 10,
      accessToken: 'access-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      sid: 'session-id',
    });
    context.loadContext().subscribe();
    http.expectOne('/api/v1/auth/context').flush({
      usuario: { login: 'Xavier_Ortega', codper: 10 },
      persona: { nombre: 'Xavier', ap: 'Ortega', am: null, foto: null },
      roles: [{ codr: 1, nombre: 'PROPIETARIO', menus: [] }],
    });
    fixture.detectChanges();
    http.expectOne('/api/v1/notificaciones/resumen').flush({ noLeidas: 0 });
    fixture.detectChanges();
  }

  it('should render ORMAN branding, a Spanish date, themes, real role and profile action', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('img[alt="ORMAN"]')).toBeTruthy();
    expect(element.textContent).toContain('ORMAN');
    expect(element.textContent).toContain('GESTIÓN DE PROPIEDADES');
    expect(element.querySelector('[aria-label="Fecha actual"]')?.textContent).toMatch(/de/);
    expect(element.querySelector('[aria-label="Fecha actual abreviada"]')?.textContent).toMatch(
      /^\s*\d+\s+[a-záéíóúñ]+\.\s+\d{4}\s*$/i,
    );
    expect(element.querySelector('[aria-label="Seleccionar tema visual"]')).toBeTruthy();
    expect(element.querySelector('[aria-label="Rol principal"]')).toBeNull();
    expect(element.querySelector('[aria-label="Notificaciones"]')).toBeTruthy();
    expect(element.querySelector('[aria-label="Abrir perfil"]')).toBeTruthy();
    expect(
      [...element.querySelectorAll('mat-icon')].map((icon) => icon.textContent?.trim()),
    ).toEqual(['notifications', 'person', 'expand_more']);
  });

  it('should emit a sidebar request from the topbar hamburger when navigation is available', () => {
    const requested = vi.fn();
    fixture.componentRef.instance.sidebarRequested.subscribe(requested);
    fixture.componentRef.setInput('hasSidebarNavigation', true);
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector('[aria-label="Abrir menú lateral"]') as HTMLButtonElement
    ).click();

    expect(requested).toHaveBeenCalledOnce();
  });

  it('should show a disabled no-role state instead of an empty selector', () => {
    authenticate();
    context.reloadContext().subscribe();
    http.expectOne('/api/v1/auth/context').flush({
      usuario: { login: 'Xavier_Ortega', codper: 10 },
      persona: { nombre: 'Xavier', ap: 'Ortega', am: null, foto: null },
      roles: [],
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#private-role-selector-desktop')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-disabled="true"]')?.textContent).toContain(
      'Sin rol asignado',
    );
  });

  it('should open and close the profile popover with the real login and neutral avatar', async () => {
    authenticate();
    const profileButton = fixture.nativeElement.querySelector(
      '[aria-label="Abrir perfil"]',
    ) as HTMLButtonElement;
    profileButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Perfil');
    expect(fixture.nativeElement.textContent).toContain('Xavier Ortega');
    expect(fixture.nativeElement.textContent).toContain('Xavier_Ortega');
    expect(fixture.nativeElement.querySelector('img.size-16')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Cerrar perfil"]')).toBeTruthy();
    expect(
      [...fixture.nativeElement.querySelectorAll('mat-icon')].map((icon: Element) =>
        icon.textContent?.trim(),
      ),
    ).toContain('close');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await Promise.resolve();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('should render all available person name parts and use a direct photo URL only when valid', () => {
    authenticate();
    context.reloadContext().subscribe();
    http.expectOne('/api/v1/auth/context').flush({
      usuario: { login: 'Xavier_Ortega', codper: 10 },
      persona: {
        nombre: 'Xavier',
        ap: 'Ortega',
        am: 'Materno',
        foto: 'https://images.example.test/xavier.jpg',
      },
      roles: [{ codr: 1, nombre: 'PROPIETARIO', menus: [] }],
    });
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('[aria-label="Abrir perfil"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Xavier Ortega Materno');
    expect((fixture.nativeElement.querySelector('img.size-16') as HTMLImageElement).src).toBe(
      'https://images.example.test/xavier.jpg',
    );
  });

  it('should populate the role selector from context and change the selected role locally', () => {
    authenticate();
    context.reloadContext().subscribe();
    http.expectOne('/api/v1/auth/context').flush({
      usuario: { login: 'Xavier_Ortega', codper: 10 },
      persona: { nombre: 'Xavier', ap: 'Ortega', am: null, foto: null },
      roles: [
        { codr: 1, nombre: 'PROPIETARIO', menus: [] },
        { codr: 2, nombre: 'ADMINISTRADOR', menus: [] },
      ],
    });
    fixture.detectChanges();

    const selector = fixture.nativeElement.querySelector(
      '#private-role-selector-desktop',
    ) as HTMLSelectElement;
    expect(selector.value).toBe('1');
    expect([...selector.options].map((option) => option.text)).toEqual([
      'PROPIETARIO',
      'ADMINISTRADOR',
    ]);

    selector.value = '2';
    selector.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(context.selectedRoleId()).toBe(2);
    expect(http.match('/api/v1/auth/context')).toHaveLength(0);
  });

  it('should expose the same role selector inside the profile popover', () => {
    authenticate();
    context.reloadContext().subscribe();
    http.expectOne('/api/v1/auth/context').flush({
      usuario: { login: 'Xavier_Ortega', codper: 10 },
      persona: { nombre: 'Xavier', ap: 'Ortega', am: null, foto: null },
      roles: [
        { codr: 1, nombre: 'PROPIETARIO', menus: [] },
        { codr: 2, nombre: 'ADMINISTRADOR', menus: [] },
      ],
    });
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('[aria-label="Abrir perfil"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    const selector = fixture.nativeElement.querySelector(
      '#private-role-selector-profile',
    ) as HTMLSelectElement;
    expect(selector.value).toBe('1');
    expect([...selector.options].map((option) => option.text)).toEqual([
      'PROPIETARIO',
      'ADMINISTRADOR',
    ]);

    selector.value = '2';
    selector.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(context.selectedRoleId()).toBe(2);

    (
      fixture.nativeElement.querySelector('[aria-label="Abrir perfil"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('[aria-label="Abrir perfil"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement.querySelector('#private-role-selector-profile') as HTMLSelectElement)
        .value,
    ).toBe('2');
  });

  it('should reuse AuthService logout from the profile action', () => {
    authenticate();
    (
      fixture.nativeElement.querySelector('[aria-label="Abrir perfil"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    const logoutButton = [...fixture.nativeElement.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Cerrar sesión'),
    ) as HTMLButtonElement;
    logoutButton.click();

    const request = http.expectOne('/api/v1/auth/logout');
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-token');
    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(auth.authenticated()).toBe(false);
  });
});
