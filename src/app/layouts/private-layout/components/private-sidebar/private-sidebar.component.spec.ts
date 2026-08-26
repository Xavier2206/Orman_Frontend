import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthContextRol } from '../../../../core/auth/auth-context.model';
import { AuthContextService } from '../../../../core/auth/auth-context.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { PrivateSidebarComponent } from './private-sidebar.component';

@Component({ template: '' })
class TestRouteComponent {}

describe('PrivateSidebarComponent', () => {
  let fixture: ComponentFixture<PrivateSidebarComponent>;
  let auth: AuthService;
  let context: AuthContextService;
  let http: HttpTestingController;
  let router: Router;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(async () => {
    originalMatchMedia = window.matchMedia;
    window.matchMedia = (() => ({ matches: true })) as unknown as typeof window.matchMedia;
    await TestBed.configureTestingModule({
      imports: [PrivateSidebarComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'app/personas/listar', component: TestRouteComponent }]),
      ],
    }).compileComponents();
    auth = TestBed.inject(AuthService);
    context = TestBed.inject(AuthContextService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(PrivateSidebarComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    auth.clearSession();
    window.matchMedia = originalMatchMedia;
  });

  function renderContext(roles: readonly AuthContextRol[]): void {
    context.loadContext().subscribe();
    http.expectOne('/api/v1/auth/context').flush({
      usuario: { login: 'Xavier_Ortega', codper: 1 },
      persona: { nombre: 'Xavier', ap: 'Ortega', am: null, foto: null },
      roles,
    });
    fixture.detectChanges();
  }

  it('should render only the first selected role menus and keep processes under their menu', () => {
    renderContext([
      {
        codr: 1,
        nombre: 'PROPIETARIO',
        menus: [
          {
            codm: 1,
            nombre: 'GESTIONAR PERSONAS',
            icono: 'group',
            procesos: [{ codp: 1, nombre: 'LISTAR PERSONAS', enlace: 'personas/listar' }],
          },
        ],
      },
    ]);

    const content = fixture.nativeElement.textContent;
    expect(context.selectedRoleId()).toBe(1);
    expect(content).toContain('GESTIONAR PERSONAS');
    expect(content).toContain('LISTAR PERSONAS');
    expect(content).not.toContain('PROPIETARIO');
    expect(content).not.toContain('Dashboard');
    expect(
      [...fixture.nativeElement.querySelectorAll('mat-icon')].map((icon: Element) =>
        icon.textContent?.trim(),
      ),
    ).toContain('group');
  });

  it('should use the generic Material icon only when a menu icon is null or blank', () => {
    renderContext([
      {
        codr: 1,
        nombre: 'PROPIETARIO',
        menus: [
          { codm: 1, nombre: 'SIN ICONO', icono: null, procesos: [] },
          { codm: 2, nombre: 'VACÍO', icono: '   ', procesos: [] },
        ],
      },
    ]);

    expect(
      [...fixture.nativeElement.querySelectorAll('mat-icon')].map((icon: Element) =>
        icon.textContent?.trim(),
      ),
    ).toEqual(['menu', 'apps', 'apps']);
  });

  it('should toggle between expanded and collapsed desktop navigation', () => {
    renderContext([
      {
        codr: 1,
        nombre: 'PROPIETARIO',
        menus: [{ codm: 1, nombre: 'GESTIONAR PERSONAS', icono: 'group', procesos: [] }],
      },
    ]);

    const toggle = fixture.nativeElement.querySelector('.sidebar-toggle') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('MENÚ');

    toggle.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sidebar-collapsed')).toBeTruthy();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.textContent).not.toContain('MENÚ');
    expect(fixture.nativeElement.querySelector('[aria-label=\"GESTIONAR PERSONAS\"]')).toBeTruthy();

    toggle.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sidebar-collapsed')).toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('should open only one flyout from collapsed menu triggers with accessible state', () => {
    renderContext([
      {
        codr: 1,
        nombre: 'PROPIETARIO',
        menus: [
          { codm: 1, nombre: 'GESTIONAR PERSONAS', icono: 'group', procesos: [] },
          { codm: 2, nombre: 'CONFIGURACIÓN', icono: 'settings', procesos: [] },
        ],
      },
    ]);

    (fixture.nativeElement.querySelector('.sidebar-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();

    const peopleTrigger = fixture.nativeElement.querySelector(
      '[aria-label=\"GESTIONAR PERSONAS\"]',
    ) as HTMLButtonElement;
    peopleTrigger.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();

    expect(peopleTrigger.getAttribute('aria-expanded')).toBe('true');
    expect(peopleTrigger.getAttribute('aria-controls')).toBe('sidebar-flyout-1');
    expect(fixture.nativeElement.querySelector('#sidebar-flyout-1')).toBeTruthy();

    const settingsTrigger = fixture.nativeElement.querySelector(
      '[aria-label=\"CONFIGURACIÓN\"]',
    ) as HTMLButtonElement;
    settingsTrigger.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#sidebar-flyout-1')).toBeNull();
    expect(fixture.nativeElement.querySelector('#sidebar-flyout-2')).toBeTruthy();
  });

  it('should close the flyout on Escape, restore trigger focus, and keep navigation collapsed', async () => {
    renderContext([
      {
        codr: 1,
        nombre: 'PROPIETARIO',
        menus: [
          {
            codm: 1,
            nombre: 'GESTIONAR PERSONAS',
            icono: 'group',
            procesos: [{ codp: 1, nombre: 'LISTAR PERSONAS', enlace: 'personas/listar' }],
          },
        ],
      },
    ]);

    (fixture.nativeElement.querySelector('.sidebar-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector(
      '[aria-label=\"GESTIONAR PERSONAS\"]',
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sidebar-flyout')).toBeNull();
    expect(document.activeElement).toBe(trigger);

    trigger.click();
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('.sidebar-flyout .sidebar-process') as HTMLAnchorElement
    ).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/app/personas/listar');
    expect(fixture.nativeElement.querySelector('.sidebar-flyout')).toBeNull();
    expect(fixture.nativeElement.querySelector('.sidebar-collapsed')).toBeTruthy();
  });

  it('should close an open flyout when the selected role changes', async () => {
    renderContext([
      {
        codr: 1,
        nombre: 'PROPIETARIO',
        menus: [{ codm: 1, nombre: 'GESTIONAR PERSONAS', icono: 'group', procesos: [] }],
      },
      {
        codr: 2,
        nombre: 'ADMINISTRADOR',
        menus: [{ codm: 2, nombre: 'CONFIGURACIÓN', icono: 'settings', procesos: [] }],
      },
    ]);

    (fixture.nativeElement.querySelector('.sidebar-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('[aria-label="GESTIONAR PERSONAS"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sidebar-flyout')).toBeTruthy();

    context.selectRole(2);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sidebar-flyout')).toBeNull();
  });

  it('should mark only the current process and its parent menu as active', async () => {
    renderContext([
      {
        codr: 1,
        nombre: 'PROPIETARIO',
        menus: [
          {
            codm: 1,
            nombre: 'GESTIONAR PERSONAS',
            icono: 'group',
            procesos: [
              { codp: 1, nombre: 'LISTAR PERSONAS', enlace: 'personas/listar' },
              { codp: 2, nombre: 'SIN ACCESO', enlace: 'personas/sin-acceso' },
            ],
          },
        ],
      },
    ]);

    await router.navigateByUrl('/app/personas/listar');
    fixture.detectChanges();

    expect(router.url).toBe('/app/personas/listar');
    const activeProcess = fixture.nativeElement.querySelector(
      '.sidebar-process-active',
    ) as HTMLButtonElement;
    expect(activeProcess.textContent?.trim()).toBe('LISTAR PERSONAS');
    expect(activeProcess.getAttribute('aria-current')).toBe('page');
    expect(fixture.nativeElement.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('.sidebar-menu-has-active-process')).toBeTruthy();
  });

  it('should navigate through the selected process link', async () => {
    renderContext([
      {
        codr: 1,
        nombre: 'PROPIETARIO',
        menus: [
          {
            codm: 1,
            nombre: 'GESTIONAR PERSONAS',
            icono: 'group',
            procesos: [{ codp: 1, nombre: 'LISTAR PERSONAS', enlace: 'personas/listar' }],
          },
        ],
      },
    ]);

    (fixture.nativeElement.querySelector('.sidebar-process') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/app/personas/listar');
  });

  it('should update locally to the selected role menus without another context request', () => {
    renderContext([
      {
        codr: 1,
        nombre: 'PROPIETARIO',
        menus: [{ codm: 1, nombre: 'CONFIGURACIÓN', icono: 'settings', procesos: [] }],
      },
      {
        codr: 2,
        nombre: 'ADMINISTRADOR',
        menus: [{ codm: 2, nombre: 'REPORTES', icono: 'assessment', procesos: [] }],
      },
    ]);
    expect(fixture.nativeElement.textContent).toContain('CONFIGURACIÓN');

    context.selectRole(2);
    fixture.detectChanges();

    expect(context.selectedRoleId()).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('REPORTES');
    expect(fixture.nativeElement.textContent).not.toContain('CONFIGURACIÓN');
    expect(fixture.nativeElement.textContent).not.toContain('ADMINISTRADOR');
    expect(http.match('/api/v1/auth/context')).toHaveLength(0);
  });

  it('should support an authenticated user without roles and a selected role without menus', () => {
    renderContext([]);
    expect(fixture.nativeElement.textContent).toContain(
      'No hay opciones de navegación disponibles para esta cuenta.',
    );

    context.reloadContext().subscribe();
    http.expectOne('/api/v1/auth/context').flush({
      usuario: { login: 'Xavier_Ortega', codper: 1 },
      persona: { nombre: 'Xavier', ap: 'Ortega', am: null, foto: null },
      roles: [{ codr: 3, nombre: 'LECTOR', menus: [] }],
    });
    fixture.detectChanges();

    expect(context.selectedRoleId()).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('Sin menús disponibles.');
    expect(fixture.nativeElement.textContent).not.toContain('LECTOR');
  });
});
