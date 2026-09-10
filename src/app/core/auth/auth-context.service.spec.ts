import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { authInterceptor } from './auth.interceptor';
import { AuthContext } from './auth-context.model';
import { AuthContextService } from './auth-context.service';
import { AuthService } from './auth.service';

const contextWithNavigation: AuthContext = {
  usuario: { login: 'Xavier_Ortega', codper: 1 },
  persona: { nombre: 'Xavier', ap: 'Ortega', am: 'Materno', foto: 'referencia-foto-test' },
  roles: [
    {
      codr: 1,
      nombre: 'PROPIETARIO',
      menus: [
        {
          codm: 1,
          nombre: 'GESTIONAR PERSONAS',
          icono: 'users',
          procesos: [{ codp: 1, nombre: 'LISTAR PERSONAS', enlace: 'personas/listar' }],
        },
      ],
    },
  ],
};

describe('AuthContextService', () => {
  let auth: AuthService;
  let context: AuthContextService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    context = TestBed.inject(AuthContextService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    auth.clearSession();
  });

  function authenticate(): void {
    auth.login('Xavier_Ortega', 'password-demo').subscribe();
    http.expectOne('/api/v1/auth/login').flush({
      status: 'AUTHENTICATED',
      login: 'Xavier_Ortega',
      codper: 1,
      accessToken: 'access-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      sid: 'session-id',
    });
  }

  it('should request and keep the complete backend context in memory', () => {
    authenticate();
    context.loadContext().subscribe();

    const request = http.expectOne('/api/v1/auth/context');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-token');
    request.flush(contextWithNavigation);

    expect(context.context()).toEqual(contextWithNavigation);
    expect(context.persona()?.foto).toBe('referencia-foto-test');
    expect(context.roles()[0].menus[0].procesos[0].enlace).toBe('personas/listar');
    expect(context.selectedRoleId()).toBe(1);
    expect(context.selectedMenus()).toEqual(contextWithNavigation.roles[0].menus);
    expect(context.loaded()).toBe(true);
    expect(context.loading()).toBe(false);
  });

  it('should support a persona without photo and empty role navigation arrays', () => {
    authenticate();
    context.loadContext().subscribe();
    http.expectOne('/api/v1/auth/context').flush({
      usuario: { login: 'sin.roles', codper: 2 },
      persona: { nombre: 'Ana', ap: 'Paz', am: null, foto: null },
      roles: [{ codr: 2, nombre: 'LECTOR', menus: [] }],
    } satisfies AuthContext);

    expect(context.persona()).toEqual({ nombre: 'Ana', ap: 'Paz', am: null, foto: null });
    expect(context.roles()[0].menus).toEqual([]);
    expect(context.selectedRoleId()).toBe(2);
  });

  it('should share one in-flight context request and clear all context data', () => {
    authenticate();
    context.loadContext().subscribe();
    context.loadContext().subscribe();
    const requests = http.match('/api/v1/auth/context');
    expect(requests).toHaveLength(1);
    requests[0].flush({ ...contextWithNavigation, roles: [] });

    context.clearContext();
    expect(context.context()).toBeNull();
    expect(context.persona()).toBeNull();
    expect(context.roles()).toEqual([]);
    expect(context.loaded()).toBe(false);
    expect(context.selectedRole()).toBeNull();
  });

  it('should restore the session before loading context after a reload', () => {
    let completed = false;
    context.restoreContext().subscribe(() => (completed = true));

    http.expectOne('/api/v1/auth/refresh').flush({
      status: 'AUTHENTICATED',
      login: 'Xavier_Ortega',
      codper: 1,
      accessToken: 'refreshed-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      sid: 'session-id',
    });
    const contextRequest = http.expectOne('/api/v1/auth/context');
    expect(contextRequest.request.headers.get('Authorization')).toBe('Bearer refreshed-token');
    contextRequest.flush(contextWithNavigation);

    expect(completed).toBe(true);
    expect(context.loaded()).toBe(true);
    expect(context.selectedRoleId()).toBe(1);
  });

  it('should clear context when logout clears the authenticated session', () => {
    authenticate();
    context.loadContext().subscribe();
    http.expectOne('/api/v1/auth/context').flush(contextWithNavigation);

    auth.logout().subscribe();
    http.expectOne('/api/v1/auth/logout').flush(null, { status: 204, statusText: 'No Content' });

    expect(context.context()).toBeNull();
    expect(context.roles()).toEqual([]);
    expect(context.selectedRoleId()).toBeNull();
  });

  it('should select only a role present in the current context without requesting data again', () => {
    authenticate();
    context.loadContext().subscribe();
    http.expectOne('/api/v1/auth/context').flush({
      ...contextWithNavigation,
      roles: [
        ...contextWithNavigation.roles,
        { codr: 2, nombre: 'ADMINISTRADOR', menus: [] },
      ],
    });

    context.selectRole(2);
    expect(context.selectedRoleId()).toBe(2);
    expect(context.selectedRole()?.nombre).toBe('ADMINISTRADOR');
    expect(http.match('/api/v1/auth/context')).toHaveLength(0);

    context.selectRole(99);
    expect(context.selectedRoleId()).toBe(2);
  });

  it('should preserve the selected role when reloading the context', () => {
    authenticate();
    context.loadContext().subscribe();
    const roles = [
      ...contextWithNavigation.roles,
      { codr: 2, nombre: 'ADMINISTRADOR', menus: [] },
    ];
    http.expectOne('/api/v1/auth/context').flush({ ...contextWithNavigation, roles });

    context.selectRole(2);
    context.reloadContext().subscribe();

    const reloadRequest = http.expectOne('/api/v1/auth/context');
    reloadRequest.flush({ ...contextWithNavigation, roles });

    expect(context.selectedRoleId()).toBe(2);
    expect(context.selectedRole()?.nombre).toBe('ADMINISTRADOR');
  });
});
