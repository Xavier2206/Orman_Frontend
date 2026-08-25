import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthContextRol } from '../../../../core/auth/auth-context.model';
import { AuthContextService } from '../../../../core/auth/auth-context.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { PrivateSidebarComponent } from './private-sidebar.component';

describe('PrivateSidebarComponent', () => {
  let fixture: ComponentFixture<PrivateSidebarComponent>;
  let auth: AuthService;
  let context: AuthContextService;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivateSidebarComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    auth = TestBed.inject(AuthService);
    context = TestBed.inject(AuthContextService);
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PrivateSidebarComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    auth.clearSession();
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
    expect(fixture.nativeElement.querySelector('mat-icon')?.textContent?.trim()).toBe('menu');
    expect([...fixture.nativeElement.querySelectorAll('mat-icon')].map((icon: Element) => icon.textContent?.trim())).toContain('group');
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

    expect([...fixture.nativeElement.querySelectorAll('mat-icon')].map((icon: Element) => icon.textContent?.trim())).toEqual([
      'menu',
      'apps',
      'apps',
    ]);
  });

  it('should update locally to the selected role menus without another context request', () => {
    renderContext([
      { codr: 1, nombre: 'PROPIETARIO', menus: [{ codm: 1, nombre: 'CONFIGURACIÓN', icono: 'settings', procesos: [] }] },
      { codr: 2, nombre: 'ADMINISTRADOR', menus: [{ codm: 2, nombre: 'REPORTES', icono: 'assessment', procesos: [] }] },
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
    expect(fixture.nativeElement.textContent).toContain('No hay opciones de navegación disponibles para esta cuenta.');

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
