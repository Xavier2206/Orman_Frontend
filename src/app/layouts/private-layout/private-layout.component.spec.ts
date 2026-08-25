import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthContextRol } from '../../core/auth/auth-context.model';
import { AuthContextService } from '../../core/auth/auth-context.service';
import { PrivateLayoutComponent } from './private-layout.component';

describe('PrivateLayoutComponent', () => {
  let fixture: ComponentFixture<PrivateLayoutComponent>;
  let context: AuthContextService;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivateLayoutComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    context = TestBed.inject(AuthContextService);
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PrivateLayoutComponent);
  });

  afterEach(() => http.verify());

  function renderContext(roles: readonly AuthContextRol[]): void {
    context.loadContext().subscribe();
    http.expectOne('/api/v1/auth/context').flush({
      usuario: { login: 'xavier', codper: 1 },
      persona: { nombre: 'Xavier', ap: 'Ortega', am: null, foto: null },
      roles,
    });
    fixture.detectChanges();
  }

  const rolesWithNavigation: readonly AuthContextRol[] = [
    {
      codr: 1,
      nombre: 'PROPIETARIO',
      menus: [{ codm: 1, nombre: 'GESTIONAR PERSONAS', icono: 'group', procesos: [] }],
    },
  ];

  it('should render desktop navigation only when the selected role has menus', () => {
    renderContext(rolesWithNavigation);

    expect(fixture.nativeElement.querySelector('app-private-topbar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-private-sidebar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('main router-outlet')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.private-sidebar-mobile-trigger')).toBeTruthy();
  });

  it('should keep the desktop compact control without restoring mock navigation', () => {
    renderContext(rolesWithNavigation);
    const collapse = fixture.nativeElement.querySelector('app-private-sidebar .sidebar-toggle') as HTMLButtonElement;
    collapse.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sidebar-collapsed')).toBeTruthy();
    expect(fixture.nativeElement.textContent).not.toContain('Dashboard');
  });

  it('should use an off-canvas drawer that opens with menu and closes with Escape or backdrop', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = (() => ({ matches: true })) as unknown as typeof window.matchMedia;
    renderContext(rolesWithNavigation);

    const menu = fixture.nativeElement.querySelector('.private-sidebar-mobile-trigger') as HTMLButtonElement;
    menu.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.private-sidebar-mobile-trigger')).toBeNull();
    expect(fixture.nativeElement.querySelector('.private-sidebar-backdrop')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[aria-label="Cerrar menú"]')).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.private-sidebar-mobile-trigger')).toBeTruthy();

    (fixture.nativeElement.querySelector('.private-sidebar-mobile-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.private-sidebar-backdrop') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.private-sidebar-mobile-trigger')).toBeTruthy();
    window.matchMedia = originalMatchMedia;
  });

  it('should remove the navigation column for users without roles or for roles without menus', () => {
    renderContext([]);
    expect(fixture.nativeElement.querySelector('app-private-sidebar')).toBeNull();
    expect(fixture.nativeElement.querySelector('.private-sidebar-mobile-trigger')).toBeNull();

    context.reloadContext().subscribe();
    http.expectOne('/api/v1/auth/context').flush({
      usuario: { login: 'xavier', codper: 1 },
      persona: { nombre: 'Xavier', ap: 'Ortega', am: null, foto: null },
      roles: [{ codr: 2, nombre: 'ADMINISTRADOR', menus: [] }],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-private-sidebar')).toBeNull();
    expect(http.match('/api/v1/auth/context')).toHaveLength(0);
  });

  it('should update navigation locally when the selected role changes', () => {
    renderContext([...rolesWithNavigation, { codr: 2, nombre: 'ADMINISTRADOR', menus: [] }]);
    expect(fixture.nativeElement.querySelector('app-private-sidebar')).toBeTruthy();

    context.selectRole(2);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-private-sidebar')).toBeNull();
    expect(http.match('/api/v1/auth/context')).toHaveLength(0);
  });
});
