import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthContextService } from '../../../../core/auth/auth-context.service';
import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { Menu } from '../../../menus/models/menu.model';
import { PageResponse } from '../../../personas/models/persona.model';
import { MeProResponse } from '../../models/me-pro-response.model';
import { Proceso } from '../../models/proceso.model';
import { AsignarProcesosListComponent } from './asignar-procesos-list.component';

describe('AsignarProcesosListComponent', () => {
  let fixture: ComponentFixture<AsignarProcesosListComponent>;
  let http: HttpTestingController;
  const notification = {
    success: vi.fn(),
    error: vi.fn(),
  };
  const authContext = {
    reloadContext: vi.fn(() => of(null)),
  };
  const menus: readonly Menu[] = [
    { codm: 11, nombre: 'Personas', icono: 'group', estado: 1 },
    { codm: 12, nombre: 'Roles', icono: 'admin_panel_settings', estado: 1 },
  ];
  const processes: readonly Proceso[] = [
    { codp: 21, nombre: 'Listar Personas', enlace: 'personas/listar', estado: 1 },
    { codp: 22, nombre: 'Listar Roles', enlace: 'roles/listar', estado: 1 },
    { codp: 23, nombre: 'Listar Menús', enlace: 'menus/listar', estado: 1 },
    { codp: 24, nombre: 'Asignar Menús', enlace: 'asignar-menus/listar', estado: 1 },
    { codp: 25, nombre: 'Asignar Procesos', enlace: 'asignar-procesos/listar', estado: 1 },
  ];
  const assignedProcess: MeProResponse = {
    codm: 11,
    nombreMenu: 'Personas',
    estadoMenu: 1,
    codp: 21,
    nombreProceso: 'Listar Personas',
    enlaceProceso: 'personas/listar',
    estadoProceso: 1,
  };
  const inactiveProcess: Proceso = {
    codp: 26,
    nombre: 'Proceso Inactivo',
    enlace: 'procesos/inactivo',
    estado: 0,
  };
  const inactiveAssignedProcess: MeProResponse = {
    ...assignedProcess,
    nombreProceso: 'Proceso Inactivo',
    enlaceProceso: 'procesos/inactivo',
    estadoProceso: 0,
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
  const processesPage: PageResponse<Proceso> = {
    content: processes,
    page: 0,
    size: 10,
    totalElements: processes.length,
    totalPages: 1,
    first: true,
    last: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignarProcesosListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthContextService, useValue: authContext },
        { provide: OrmanNotificationService, useValue: notification },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AsignarProcesosListComponent);
    vi.clearAllMocks();
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  function menusRequest(page = 0, query = ''): ReturnType<HttpTestingController['expectOne']> {
    const request = http.expectOne((candidate) => candidate.url === '/api/v1/menus');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('estado')).toBe('1');
    expect(request.request.params.get('page')).toBe(String(page));
    expect(request.request.params.get('size')).toBe('10');
    expect(request.request.params.get('sort')).toBe('nombre,asc');
    expect(request.request.params.get('q')).toBe(query || null);

    return request;
  }

  function processesRequest(page = 0): ReturnType<HttpTestingController['expectOne']> {
    const request = http.expectOne((candidate) => candidate.url === '/api/v1/procesos');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe(String(page));
    expect(request.request.params.get('size')).toBe('10');
    expect(request.request.params.get('sort')).toBe('nombre,asc');

    return request;
  }

  function initial(catalog = processes): void {
    fixture.detectChanges();
    menusRequest().flush(menusPage);
    processesRequest().flush({
      ...processesPage,
      content: catalog,
      totalElements: catalog.length,
    });
    fixture.detectChanges();
  }

  function selectFirstMenu(assigned: readonly MeProResponse[] = []): void {
    initial();

    const menuButton = fixture.nativeElement.querySelector(
      '[aria-label="Menús disponibles"] button',
    ) as HTMLButtonElement;

    menuButton.click();
    http.expectOne('/api/v1/menus/11/procesos').flush(assigned);
    fixture.detectChanges();
  }

  it('renders the master-detail structure and initial empty detail', () => {
    initial();

    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
      'Asignar Procesos a Menú',
    );
    expect(fixture.nativeElement.querySelector('[aria-label="Menús disponibles"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#selected-menu-title')?.textContent).toContain(
      'Administrar Procesos',
    );
  });

  it('searches Menús remotely with the confirmed query parameter', () => {
    vi.useFakeTimers();
    initial();

    const searchInput = fixture.nativeElement.querySelector('#menu-search') as HTMLInputElement;

    searchInput.value = 'roles';
    searchInput.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(350);

    menusRequest(0, 'roles').flush({
      ...menusPage,
      content: [menus[1]],
      totalElements: 1,
    });
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('[aria-label="Menús disponibles"] button'),
    ).toHaveLength(1);
  });

  it('loads the selected Menú and renders assigned and available Procesos', () => {
    selectFirstMenu([assignedProcess]);

    expect(fixture.nativeElement.querySelector('#selected-menu-title')?.textContent).toContain(
      'Personas',
    );
    expect(fixture.nativeElement.textContent).toContain('Procesos asignados');
    expect(fixture.nativeElement.textContent).toContain('Listar Personas');
    expect(fixture.nativeElement.textContent).toContain('Procesos disponibles');
    expect(fixture.nativeElement.textContent).toContain('Listar Roles');
  });

  it('excludes inactive Procesos from the available catalog', () => {
    initial([...processes, inactiveProcess]);

    const menuButton = fixture.nativeElement.querySelector(
      '[aria-label="Menús disponibles"] button',
    ) as HTMLButtonElement;

    menuButton.click();
    http.expectOne('/api/v1/menus/11/procesos').flush([]);
    fixture.detectChanges();

    const availableSection = fixture.nativeElement.querySelector(
      'section[aria-labelledby="available-processes-title"]',
    ) as HTMLElement;

    expect(availableSection.textContent).not.toContain('Proceso Inactivo');
  });

  it('renders an inactive assigned Proceso without making it available', () => {
    selectFirstMenu([inactiveAssignedProcess]);

    const assignedSection = fixture.nativeElement.querySelector(
      'section[aria-labelledby="assigned-processes-title"]',
    ) as HTMLElement;
    const availableSection = fixture.nativeElement.querySelector(
      'section[aria-labelledby="available-processes-title"]',
    ) as HTMLElement;

    expect(assignedSection.textContent).toContain('Inactivo');
    expect(availableSection.textContent).not.toContain('Listar Personas');
  });

  it('filters available Procesos by code', () => {
    selectFirstMenu();

    const availableSection = fixture.nativeElement.querySelector(
      'section[aria-labelledby="available-processes-title"]',
    ) as HTMLElement;
    const searchInput = availableSection.querySelector(
      '#available-process-search',
    ) as HTMLInputElement;

    searchInput.value = '24';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(availableSection.querySelectorAll('.process-card')).toHaveLength(1);
    expect(availableSection.textContent).toContain('Asignar Menús');
    expect(availableSection.textContent).not.toContain('asignar-menus/listar');
  });

  it('paginates assigned and available Procesos independently with four cards per page', () => {
    const catalog = Array.from({ length: 10 }, (_, index) => ({
      codp: index + 1,
      nombre: 'Proceso ' + (index + 1),
      enlace: 'procesos/' + (index + 1),
      estado: 1 as const,
    }));
    const assigned = catalog.slice(0, 5).map((process) => ({
      codm: 11,
      nombreMenu: 'Personas',
      estadoMenu: 1 as const,
      codp: process.codp,
      nombreProceso: process.nombre,
      enlaceProceso: process.enlace,
      estadoProceso: process.estado,
    } satisfies MeProResponse));

    initial(catalog);
    const menuButton = fixture.nativeElement.querySelector(
      '[aria-label="Menús disponibles"] button',
    ) as HTMLButtonElement;

    menuButton.click();
    http.expectOne('/api/v1/menus/11/procesos').flush(assigned);
    fixture.detectChanges();

    const assignedSection = fixture.nativeElement.querySelector(
      'section[aria-labelledby="assigned-processes-title"]',
    ) as HTMLElement;
    const availableSection = fixture.nativeElement.querySelector(
      'section[aria-labelledby="available-processes-title"]',
    ) as HTMLElement;

    expect(assignedSection.querySelectorAll('.process-card')).toHaveLength(4);
    expect(availableSection.querySelectorAll('.process-card')).toHaveLength(4);
    (assignedSection.querySelectorAll('.pagination button')[1] as HTMLButtonElement).click();
    (availableSection.querySelectorAll('.pagination button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(assignedSection.textContent).toContain('Página 2 de 2');
    expect(availableSection.textContent).toContain('Página 2 de 2');
  });

  it('assigns a Proceso and refreshes the selected Menú', () => {
    selectFirstMenu();

    const availableSection = fixture.nativeElement.querySelector(
      'section[aria-labelledby="available-processes-title"]',
    ) as HTMLElement;
    (availableSection.querySelector('.menu-action-assign') as HTMLButtonElement).click();

    const assignRequest = http.expectOne('/api/v1/menus/11/procesos/21');

    expect(assignRequest.request.method).toBe('POST');
    expect(assignRequest.request.body).toBeNull();
    assignRequest.flush(assignedProcess, { status: 201, statusText: 'Created' });
    expect(notification.success).toHaveBeenCalledWith('Proceso asignado correctamente.');
    expect(authContext.reloadContext).toHaveBeenCalledTimes(1);

    http.expectOne('/api/v1/menus/11/procesos').flush([assignedProcess]);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('section[aria-labelledby="assigned-processes-title"]')
        ?.textContent,
    ).toContain('Listar Personas');
    expect(
      fixture.nativeElement.querySelector('section[aria-labelledby="assigned-processes-title"]')
        ?.textContent,
    ).not.toContain('personas/listar');
  });

  it('reports a ProblemDetail when removing a Proceso fails with conflict', () => {
    selectFirstMenu([assignedProcess]);

    const assignedSection = fixture.nativeElement.querySelector(
      'section[aria-labelledby="assigned-processes-title"]',
    ) as HTMLElement;
    (assignedSection.querySelector('.menu-action-remove') as HTMLButtonElement).click();

    const removeRequest = http.expectOne('/api/v1/menus/11/procesos/21');

    removeRequest.flush(
      { detail: 'El Proceso no puede retirarse.' },
      { status: 409, statusText: 'Conflict' },
    );

    expect(notification.error).toHaveBeenCalledWith('El Proceso no puede retirarse.');
  });

  it.each([
    { status: 401, message: 'La sesión ha expirado.' },
    { status: 403, message: 'Acceso denegado.' },
    { status: 404, message: 'No se encontró los Procesos.' },
  ])('reports HTTP $status while loading assigned Procesos', ({ status, message }) => {
    initial();

    const menuButton = fixture.nativeElement.querySelector(
      '[aria-label="Menús disponibles"] button',
    ) as HTMLButtonElement;
    menuButton.click();

    http
      .expectOne('/api/v1/menus/11/procesos')
      .flush({}, { status, statusText: 'Error' });
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        'section[aria-labelledby="selected-menu-title"] .alert',
      )?.textContent,
    ).toContain(message);
  });

  it('reports a validation error when assigning an inactive Proceso', () => {
    selectFirstMenu();

    const availableSection = fixture.nativeElement.querySelector(
      'section[aria-labelledby="available-processes-title"]',
    ) as HTMLElement;
    (availableSection.querySelector('.menu-action-assign') as HTMLButtonElement).click();

    const assignRequest = http.expectOne('/api/v1/menus/11/procesos/21');
    assignRequest.flush(
      { detail: 'El Proceso está inactivo.' },
      { status: 422, statusText: 'Unprocessable Entity' },
    );

    expect(notification.error).toHaveBeenCalledWith('El Proceso está inactivo.');
  });

  it('keeps only the latest selected Menú response', () => {
    initial();

    const menuButtons = fixture.nativeElement.querySelectorAll(
      '[aria-label="Menús disponibles"] button',
    ) as NodeListOf<HTMLButtonElement>;

    menuButtons[0].click();
    menuButtons[1].click();

    const cancelledRequest = http.expectOne('/api/v1/menus/11/procesos');
    expect(cancelledRequest.cancelled).toBe(true);
    http.expectOne('/api/v1/menus/12/procesos').flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#selected-menu-title')?.textContent).toContain(
      'Roles',
    );
    expect(
      fixture.nativeElement.querySelector(
        'section[aria-labelledby="assigned-processes-title"]',
      )?.textContent,
    ).toContain('Este Menú no tiene Procesos asignados.');
  });

  it('prevents simultaneous Process actions', () => {
    selectFirstMenu();

    const availableSection = fixture.nativeElement.querySelector(
      'section[aria-labelledby="available-processes-title"]',
    ) as HTMLElement;
    const actionButtons = availableSection.querySelectorAll(
      '.menu-action-assign',
    ) as NodeListOf<HTMLButtonElement>;

    actionButtons[0].click();
    fixture.detectChanges();

    expect(actionButtons[1].disabled).toBe(true);
    expect(
      http.match((request) => request.url.includes('/api/v1/menus/11/procesos/')),
    ).toHaveLength(1);
  });
});
