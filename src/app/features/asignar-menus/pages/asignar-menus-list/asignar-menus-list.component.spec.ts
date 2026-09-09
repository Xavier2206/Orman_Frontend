import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { Menu } from '../../../menus/models/menu.model';
import { PageResponse } from '../../../personas/models/persona.model';
import { Rol } from '../../../roles/models/rol.model';
import { AsignarMenusListComponent } from './asignar-menus-list.component';

describe('AsignarMenusListComponent', () => {
  let fixture: ComponentFixture<AsignarMenusListComponent>;
  let http: HttpTestingController;
  const notification = {
    success: vi.fn(),
    error: vi.fn(),
  };
  const roles: readonly Rol[] = [
    { codr: 1, nombre: 'ADMINISTRADOR', estado: 1 },
    { codr: 2, nombre: 'AUDITOR', estado: 1 },
  ];
  const menus: readonly Menu[] = [
    { codm: 11, nombre: 'Personas', icono: 'group', estado: 1 },
    { codm: 12, nombre: 'Roles', icono: 'admin_panel_settings', estado: 1 },
    { codm: 13, nombre: 'Menús', icono: 'menu', estado: 1 },
    { codm: 14, nombre: 'Reportes', icono: null, estado: 1 },
    { codm: 15, nombre: 'Configuración', icono: 'settings', estado: 1 },
  ];
  const rolesPage: PageResponse<Rol> = {
    content: roles,
    page: 0,
    size: 10,
    totalElements: roles.length,
    totalPages: 1,
    first: true,
    last: true,
  };
  const menusPage: PageResponse<Menu> = {
    content: menus,
    page: 0,
    size: 10,
    totalElements: menus.length,
    totalPages: 1,
    first: true,
    last: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignarMenusListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OrmanNotificationService, useValue: notification },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AsignarMenusListComponent);
    vi.clearAllMocks();
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  function rolesRequest(page = 0, query = ''): ReturnType<HttpTestingController['expectOne']> {
    const request = http.expectOne((candidate) => candidate.url === '/api/v1/roles');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('estado')).toBe('1');
    expect(request.request.params.get('page')).toBe(String(page));
    expect(request.request.params.get('size')).toBe('10');
    expect(request.request.params.get('sort')).toBe('nombre,asc');
    expect(request.request.params.get('q')).toBe(query || null);

    return request;
  }

  function menusRequest(page = 0): ReturnType<HttpTestingController['expectOne']> {
    const request = http.expectOne((candidate) => candidate.url === '/api/v1/menus');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('estado')).toBe('1');
    expect(request.request.params.get('page')).toBe(String(page));
    expect(request.request.params.get('size')).toBe('10');
    expect(request.request.params.get('sort')).toBe('nombre,asc');

    return request;
  }

  function initial(catalog = menus): void {
    fixture.detectChanges();
    rolesRequest().flush(rolesPage);
    menusRequest().flush({
      ...menusPage,
      content: catalog,
      totalElements: catalog.length,
    });
    fixture.detectChanges();
  }

  function selectFirstRole(assigned: readonly Menu[] = []): void {
    initial();

    const roleButton = fixture.nativeElement.querySelector(
      '[aria-label="Roles disponibles"] button',
    ) as HTMLButtonElement;

    roleButton.click();
    http.expectOne('/api/v1/roles/1/menus').flush(assigned);
    fixture.detectChanges();
  }

  it('renders the master-detail structure and the initial empty state', () => {
    initial();

    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
      'Asignar Menús a Rol',
    );
    expect(fixture.nativeElement.querySelector('[aria-label="Roles disponibles"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#selected-role-title')?.textContent).toContain(
      'Administrar Menús',
    );
  });

  it('searches Roles remotely with the confirmed query parameter', () => {
    vi.useFakeTimers();
    initial();

    const searchInput = fixture.nativeElement.querySelector('#role-search') as HTMLInputElement;

    searchInput.value = 'admin';
    searchInput.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(350);

    rolesRequest(0, 'admin').flush({
      ...rolesPage,
      content: [roles[0]],
      totalElements: 1,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('[aria-label="Roles disponibles"] button')).toHaveLength(
      1,
    );
  });

  it('loads the selected Role and renders assigned and available Menús', () => {
    selectFirstRole([menus[0]]);

    expect(fixture.nativeElement.querySelector('#selected-role-title')?.textContent).toContain(
      'ADMINISTRADOR',
    );
    expect(fixture.nativeElement.textContent).toContain('Menús asignados');
    expect(fixture.nativeElement.textContent).toContain('Personas');
    expect(fixture.nativeElement.textContent).toContain('Menús disponibles');
    expect(fixture.nativeElement.textContent).toContain('Roles');
    expect(fixture.nativeElement.textContent).not.toContain('Protegido');
  });

  it('filters available Menús by code and uses the visual icon fallback', () => {
    selectFirstRole();

    const availableSection = fixture.nativeElement.querySelector(
      'section[aria-labelledby="available-menus-title"]',
    ) as HTMLElement;
    const searchInput = availableSection.querySelector('#available-menu-search') as HTMLInputElement;

    searchInput.value = '14';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(availableSection.querySelectorAll('.menu-card')).toHaveLength(1);
    expect(availableSection.textContent).toContain('Reportes');
    expect(availableSection.querySelector('.menu-card-icon')?.textContent).toContain('menu');
  });

  it('shows the empty state when the selected Role has no assigned Menús', () => {
    selectFirstRole();

    const assignedSection = fixture.nativeElement.querySelector(
      'section[aria-labelledby="assigned-menus-title"]',
    ) as HTMLElement;

    expect(assignedSection.textContent).toContain('Este Rol no tiene Menús asignados.');
  });

  it('paginates assigned and available Menús independently with four cards per page', () => {
    const catalog = Array.from({ length: 10 }, (_, index) => ({
      codm: index + 1,
      nombre: 'Menú ' + (index + 1),
      icono: null,
      estado: 1 as const,
    }));
    const assigned = catalog.slice(0, 5);

    initial(catalog);
    const roleButton = fixture.nativeElement.querySelector(
      '[aria-label="Roles disponibles"] button',
    ) as HTMLButtonElement;

    roleButton.click();
    http.expectOne('/api/v1/roles/1/menus').flush(assigned);
    fixture.detectChanges();

    const assignedSection = fixture.nativeElement.querySelector(
      'section[aria-labelledby="assigned-menus-title"]',
    ) as HTMLElement;
    const availableSection = fixture.nativeElement.querySelector(
      'section[aria-labelledby="available-menus-title"]',
    ) as HTMLElement;

    expect(assignedSection.querySelectorAll('.menu-card')).toHaveLength(4);
    expect(availableSection.querySelectorAll('.menu-card')).toHaveLength(4);
    (assignedSection.querySelectorAll('.pagination button')[1] as HTMLButtonElement).click();
    (availableSection.querySelectorAll('.pagination button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(assignedSection.textContent).toContain('Página 2 de 2');
    expect(availableSection.textContent).toContain('Página 2 de 2');
  });

  it('assigns a Menu and refreshes the selected Role', () => {
    selectFirstRole();

    const availableSection = fixture.nativeElement.querySelector(
      'section[aria-labelledby="available-menus-title"]',
    ) as HTMLElement;
    (availableSection.querySelector('.menu-action-assign') as HTMLButtonElement).click();

    const assignRequest = http.expectOne('/api/v1/roles/1/menus/11');

    expect(assignRequest.request.method).toBe('POST');
    assignRequest.flush({});
    expect(notification.success).toHaveBeenCalledWith('Menú asignado correctamente.');

    http.expectOne('/api/v1/roles/1/menus').flush([menus[0]]);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        'section[aria-labelledby="assigned-menus-title"]',
      )?.textContent,
    ).toContain('Personas');
  });

  it('reports a ProblemDetail when removing a Menu fails with conflict', () => {
    selectFirstRole([menus[0]]);

    const assignedSection = fixture.nativeElement.querySelector(
      'section[aria-labelledby="assigned-menus-title"]',
    ) as HTMLElement;
    (assignedSection.querySelector('.menu-action-remove') as HTMLButtonElement).click();

    const removeRequest = http.expectOne('/api/v1/roles/1/menus/11');

    removeRequest.flush(
      { detail: 'El Menú no puede retirarse.' },
      { status: 409, statusText: 'Conflict' },
    );

    expect(notification.error).toHaveBeenCalledWith('El Menú no puede retirarse.');
  });
});
