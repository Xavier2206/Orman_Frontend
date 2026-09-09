import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { PageResponse, Persona } from '../../../personas/models/persona.model';
import { Rol } from '../../../roles/models/rol.model';
import { Usuario } from '../../models/usuario.model';
import { AsignarRolesListComponent } from './asignar-roles-list.component';

describe('AsignarRolesListComponent', () => {
  let fixture: ComponentFixture<AsignarRolesListComponent>;
  let http: HttpTestingController;
  const notification = {
    success: vi.fn(),
    error: vi.fn(),
  };
  const makeUser = (
    login: string,
    codper: number,
    nombre = login,
    ap: string | null = null,
    am: string | null = null,
  ): Usuario => ({ login, estado: 1, codper, nombre, ap, am });
  const users: readonly Usuario[] = [
    makeUser('ana', 7, 'Ana', 'Paz', 'Mendoza'),
    makeUser('bruno', 8, 'Bruno'),
  ];
  const persona: Persona = {
    codper: 7,
    ci: '1234567',
    nombre: 'Ana',
    ap: 'Paz',
    am: 'Mendoza',
    genero: 'F',
    estado: 1,
    correo: 'ana@example.com',
    telefono: '70000000',
    tipoPersona: 'A',
    foto: null,
    fechaRegistro: '2026-09-08T12:00:00Z',
    usuario: { login: 'ana', estado: 1 },
    acciones: {
      puedeEditar: true,
      puedeDesactivar: true,
      puedeActivar: false,
      puedeEliminar: false,
      puedeCrearUsuario: false,
      puedeCambiarPassword: true,
    },
  };
  const roles: readonly Rol[] = [
    { codr: 1, nombre: 'PROPIETARIO', estado: 1 },
    { codr: 2, nombre: 'ADMINISTRADOR', estado: 1 },
  ];
  const usersPage: PageResponse<Usuario> = {
    content: users,
    page: 0,
    size: 5,
    totalElements: 2,
    totalPages: 1,
    first: true,
    last: true,
  };
  const rolesPage: PageResponse<Rol> = {
    content: roles,
    page: 0,
    size: 10,
    totalElements: 2,
    totalPages: 1,
    first: true,
    last: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignarRolesListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OrmanNotificationService, useValue: notification },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AsignarRolesListComponent);
    vi.clearAllMocks();
  });

  afterEach(() => http.verify());

  function usersRequest(page = 0, query = ''): ReturnType<HttpTestingController['expectOne']> {
    const request = http.expectOne((candidate) => candidate.url === '/api/v1/usuarios');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe(`${page}`);
    expect(request.request.params.get('size')).toBe('5');
    expect(request.request.params.get('sort')).toBe('login,asc');
    expect(request.request.params.get('q')).toBe(query || null);

    return request;
  }

  function rolesRequest(page = 0): ReturnType<HttpTestingController['expectOne']> {
    const request = http.expectOne((candidate) => candidate.url === '/api/v1/roles');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('estado')).toBe('1');
    expect(request.request.params.get('page')).toBe(`${page}`);
    expect(request.request.params.get('size')).toBe('10');
    expect(request.request.params.get('sort')).toBe('nombre,asc');

    return request;
  }

  function personaRequest(codper = 7): ReturnType<HttpTestingController['expectOne']> {
    const request = http.expectOne(`/api/v1/personas/${codper}`);

    expect(request.request.method).toBe('GET');
    return request;
  }

  function initial(): void {
    fixture.detectChanges();
    usersRequest().flush(usersPage);
    rolesRequest().flush(rolesPage);
    fixture.detectChanges();
  }

  function selectedUserWithRoles(catalogRoles: readonly Rol[]): HTMLElement {
    fixture.detectChanges();
    usersRequest().flush(usersPage);
    rolesRequest().flush({
      ...rolesPage,
      content: catalogRoles,
      totalElements: catalogRoles.length,
    });
    fixture.detectChanges();

    const userButton = fixture.nativeElement.querySelector(
      '[aria-label="Usuarios disponibles"] button',
    ) as HTMLButtonElement;
    userButton.click();
    http.expectOne('/api/v1/usuarios/ana/roles').flush([]);
    personaRequest().flush(persona);
    fixture.detectChanges();

    return fixture.nativeElement.querySelector(
      'section[aria-labelledby="available-roles-title"]',
    ) as HTMLElement;
  }

  function selectedUserWithAssignedRoles(
    userRoles: readonly Rol[],
    catalogRoles: readonly Rol[] = userRoles,
  ): HTMLElement {
    fixture.detectChanges();
    usersRequest().flush(usersPage);
    rolesRequest().flush({
      ...rolesPage,
      content: catalogRoles,
      totalElements: catalogRoles.length,
    });
    fixture.detectChanges();

    const userButton = fixture.nativeElement.querySelector(
      '[aria-label="Usuarios disponibles"] button',
    ) as HTMLButtonElement;
    userButton.click();
    http.expectOne('/api/v1/usuarios/ana/roles').flush(userRoles);
    personaRequest().flush(persona);
    fixture.detectChanges();

    return fixture.nativeElement.querySelector(
      'section[aria-labelledby="assigned-roles-title"]',
    ) as HTMLElement;
  }

  it('renders the master-detail structure and the initial empty state', () => {
    initial();

    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe(
      'Asignar Roles a Usuario',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Selecciona un usuario y administra los Roles asignados en una sola vista.',
    );
    expect(fixture.nativeElement.querySelector('#user-search')?.getAttribute('placeholder')).toBe(
      'Buscar usuario por login o nombre...',
    );
    expect(fixture.nativeElement.querySelectorAll('[role="list"] button')).toHaveLength(2);
    expect(fixture.nativeElement.textContent).toContain(
      'Selecciona un usuario para administrar sus roles.',
    );
    expect(
      fixture.nativeElement.querySelector('nav[aria-label="Paginación de Usuarios"]'),
    ).toBeNull();
  });

  it.each([
    { totalElements: 1, totalPages: 1 },
    { totalElements: 5, totalPages: 1 },
  ])(
    'does not show the user paginator for $totalElements users',
    ({ totalElements, totalPages }) => {
      const pageUsers = Array.from({ length: totalElements }, (_, index) =>
        makeUser(`usuario-${index + 1}`, index + 1),
      );

      fixture.detectChanges();
      usersRequest().flush({
        ...usersPage,
        content: pageUsers,
        totalElements,
        totalPages,
      });
      rolesRequest().flush(rolesPage);
      fixture.detectChanges();

      expect(
        fixture.nativeElement.querySelectorAll('[aria-label="Usuarios disponibles"] button'),
      ).toHaveLength(totalElements);
      expect(
        fixture.nativeElement.querySelector('nav[aria-label="Paginación de Usuarios"]'),
      ).toBeNull();
    },
  );

  it.each([
    { totalElements: 6, totalPages: 2 },
    { totalElements: 10, totalPages: 2 },
    { totalElements: 11, totalPages: 3 },
  ])(
    'shows and navigates the user paginator for $totalElements users',
    ({ totalElements, totalPages }) => {
      const firstPageUsers = Array.from({ length: Math.min(5, totalElements) }, (_, index) =>
        makeUser(`usuario-${index + 1}`, index + 1),
      );

      fixture.detectChanges();
      usersRequest().flush({
        ...usersPage,
        content: firstPageUsers,
        size: 5,
        totalElements,
        totalPages,
        last: false,
      });
      rolesRequest().flush(rolesPage);
      fixture.detectChanges();

      const userList = fixture.nativeElement.querySelector('[aria-label="Usuarios disponibles"]');
      const pagination = fixture.nativeElement.querySelector(
        'nav[aria-label="Paginación de Usuarios"]',
      ) as HTMLElement;

      expect(userList.querySelectorAll('button')).toHaveLength(5);
      expect(pagination.textContent).toContain('Página 1 de ' + totalPages);
      expect((pagination.querySelector('button') as HTMLButtonElement).disabled).toBe(true);

      (pagination.querySelectorAll('button')[1] as HTMLButtonElement).click();
      const secondPage = http.expectOne((candidate) => candidate.url === '/api/v1/usuarios');
      expect(secondPage.request.params.get('page')).toBe('1');
      secondPage.flush({
        ...usersPage,
        content: Array.from({ length: Math.min(5, totalElements - 5) }, (_, index) =>
          makeUser(`usuario-${index + 6}`, index + 6),
        ),
        page: 1,
        size: 5,
        totalElements,
        totalPages,
        first: false,
        last: totalPages === 2,
      });
      fixture.detectChanges();

      expect(userList.querySelectorAll('button')).toHaveLength(Math.min(5, totalElements - 5));
      expect(pagination.textContent).toContain('Página 2 de ' + totalPages);
      expect((pagination.querySelectorAll('button')[1] as HTMLButtonElement).disabled).toBe(
        totalPages === 2,
      );

      if (totalElements > 10) {
        (pagination.querySelectorAll('button')[1] as HTMLButtonElement).click();
        const thirdPage = http.expectOne((candidate) => candidate.url === '/api/v1/usuarios');
        expect(thirdPage.request.params.get('page')).toBe('2');
        thirdPage.flush({
          ...usersPage,
          content: [makeUser('usuario-11', 11)],
          page: 2,
          size: 5,
          totalElements,
          totalPages,
          first: false,
          last: true,
        });
        fixture.detectChanges();

        expect(userList.querySelectorAll('button')).toHaveLength(1);
        expect(pagination.textContent).toContain('Página 3 de 3');
        expect((pagination.querySelectorAll('button')[1] as HTMLButtonElement).disabled).toBe(true);
      }
    },
  );

  it.each([{ query: 'Xavier_Ortega' }, { query: 'Xavier' }, { query: 'Ortega' }])(
    'searches users remotely by login, name, and surname: $query',
    ({ query }) => {
      initial();
      vi.useFakeTimers();

      try {
        const searchInput = fixture.nativeElement.querySelector('#user-search') as HTMLInputElement;
        searchInput.value = query;
        searchInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        vi.advanceTimersByTime(350);
        usersRequest(0, query).flush({
          ...usersPage,
          content: [makeUser('Xavier_Ortega', 17, 'Xavier', 'Ortega', 'Mancilla')],
          totalElements: 1,
        });
        fixture.detectChanges();

        const userButtons = fixture.nativeElement.querySelectorAll(
          '[aria-label="Usuarios disponibles"] button',
        );

        expect(userButtons).toHaveLength(1);
        expect(userButtons[0].textContent).toContain('Xavier_Ortega');
        expect(userButtons[0].textContent).toContain('Xavier Ortega Mancilla');
      } finally {
        vi.useRealTimers();
      }
    },
  );

  it('returns to the unfiltered remote page when the user search is cleared', () => {
    initial();
    vi.useFakeTimers();

    try {
      const searchInput = fixture.nativeElement.querySelector('#user-search') as HTMLInputElement;
      searchInput.value = 'Xavier';
      searchInput.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(350);
      usersRequest(0, 'Xavier').flush({
        ...usersPage,
        content: [makeUser('Xavier_Ortega', 17, 'Xavier', 'Ortega', 'Mancilla')],
        totalElements: 1,
      });

      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(350);
      usersRequest(0).flush(usersPage);
      fixture.detectChanges();

      expect(
        fixture.nativeElement.querySelectorAll('[aria-label="Usuarios disponibles"] button'),
      ).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows the remote empty state when no user matches the query', () => {
    initial();
    vi.useFakeTimers();

    try {
      const searchInput = fixture.nativeElement.querySelector('#user-search') as HTMLInputElement;
      searchInput.value = 'inexistente';
      searchInput.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(350);
      usersRequest(0, 'inexistente').flush({
        ...usersPage,
        content: [],
        totalElements: 0,
        totalPages: 0,
      });
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('No se encontraron usuarios.');
      expect(
        fixture.nativeElement.querySelectorAll('[aria-label="Usuarios disponibles"] button'),
      ).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the remote query when changing the user page', () => {
    fixture.detectChanges();
    usersRequest().flush({
      ...usersPage,
      content: Array.from({ length: 5 }, (_, index) => makeUser(`usuario-${index + 1}`, index + 1)),
      totalElements: 6,
      totalPages: 2,
      last: false,
    });
    rolesRequest().flush(rolesPage);
    fixture.detectChanges();
    vi.useFakeTimers();

    try {
      const searchInput = fixture.nativeElement.querySelector('#user-search') as HTMLInputElement;
      searchInput.value = 'Javier';
      searchInput.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(350);
      usersRequest(0, 'Javier').flush({
        ...usersPage,
        content: [makeUser('Javier_Alvarez', 18, 'Javier', 'Alvarez', null)],
        page: 0,
        totalElements: 6,
        totalPages: 2,
        last: false,
      });
      fixture.detectChanges();

      const pagination = fixture.nativeElement.querySelector('nav.pagination') as HTMLElement;
      (pagination.querySelectorAll('button')[1] as HTMLButtonElement).click();

      usersRequest(1, 'Javier').flush({
        ...usersPage,
        content: [makeUser('Javier_Zamora', 19, 'Javier', 'Zamora', null)],
        page: 1,
        totalElements: 6,
        totalPages: 2,
        first: false,
        last: true,
      });
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Javier_Zamora');
      expect(fixture.nativeElement.textContent).not.toContain('Javier_Alvarez');
    } finally {
      vi.useRealTimers();
    }
  });

  it('displays the login as the selected-user heading and the Persona full name beneath it', () => {
    initial();

    const userButton = fixture.nativeElement.querySelector(
      '[aria-label="Usuarios disponibles"] button',
    ) as HTMLButtonElement;
    userButton.click();
    const request = http.expectOne('/api/v1/usuarios/ana/roles');
    expect(request.request.method).toBe('GET');
    request.flush([{ codr: roles[1].codr, nombre: '', estado: roles[1].estado }]);
    personaRequest().flush(persona);
    fixture.detectChanges();

    const selectedProfile = fixture.nativeElement.querySelector('.selected-profile') as HTMLElement;
    const selectedUserOption = fixture.nativeElement.querySelector(
      '[aria-label="Usuarios disponibles"] button',
    ) as HTMLElement;
    const userIdentity = selectedUserOption.querySelectorAll(':scope > span.min-w-0 > span');

    expect(selectedProfile.querySelector('h2')?.textContent?.trim()).toBe('ana');
    expect(selectedProfile.textContent).toContain('Ana Paz Mendoza');
    expect(userIdentity[0]?.textContent?.trim()).toBe('ana');
    expect(userIdentity[1]?.textContent?.trim()).toBe('Ana Paz Mendoza');
    expect(fixture.nativeElement.querySelector('.profile-data')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Estado Usuario');
    expect(fixture.nativeElement.textContent).not.toContain('Estado Persona');
    expect(selectedProfile.textContent).not.toContain(
      'Usuario seleccionado para administración de Roles.',
    );
    expect(fixture.nativeElement.textContent).toContain('ADMINISTRADOR');
    expect(fixture.nativeElement.textContent).toContain('PROPIETARIO');
    expect(fixture.nativeElement.querySelector('#assigned-roles-title')?.textContent?.trim()).toBe(
      'Roles asignados',
    );
    expect(fixture.nativeElement.querySelector('#available-roles-title')?.textContent?.trim()).toBe(
      'Roles disponibles para asignar',
    );
    expect(fixture.nativeElement.querySelectorAll('.roles-grid')).toHaveLength(2);
    expect(
      fixture.nativeElement.querySelectorAll('.roles-grid')[0].querySelectorAll('.role-badges'),
    ).toHaveLength(1);
    expect(
      fixture.nativeElement.querySelectorAll('.roles-grid')[0].querySelectorAll('.protected-badge'),
    ).toHaveLength(0);
    expect(
      fixture.nativeElement.querySelector('.roles-grid')?.querySelectorAll('.role-card'),
    ).toHaveLength(1);
    expect(fixture.nativeElement.textContent).not.toContain('Fecha de asignación');
    expect(fixture.nativeElement.querySelectorAll('.role-action-remove')).toHaveLength(1);
    expect(fixture.nativeElement.querySelectorAll('.role-action-assign')).toHaveLength(1);
  });

  it('shows the fallback code when an assigned role is absent from the active catalog', () => {
    initial();

    const userButton = fixture.nativeElement.querySelector(
      '[aria-label="Usuarios disponibles"] button',
    ) as HTMLButtonElement;
    userButton.click();
    http
      .expectOne('/api/v1/usuarios/ana/roles')
      .flush([{ codr: 99, nombre: 'ROL_NO_CATALOGADO', estado: 0 }]);
    personaRequest().flush(persona);
    fixture.detectChanges();

    const assignedGrid = fixture.nativeElement.querySelectorAll('.roles-grid')[0] as HTMLElement;

    expect(assignedGrid.textContent).toContain('Código #99');
    expect(assignedGrid.textContent).toContain('Inactivo');
    expect(assignedGrid.textContent).not.toContain('ROL_NO_CATALOGADO');
  });

  it('uses the catalog name and protected badge for an assigned PROPIETARIO role', () => {
    initial();

    const userButton = fixture.nativeElement.querySelector(
      '[aria-label="Usuarios disponibles"] button',
    ) as HTMLButtonElement;
    userButton.click();
    http
      .expectOne('/api/v1/usuarios/ana/roles')
      .flush([{ codr: roles[0].codr, nombre: '', estado: roles[0].estado }]);
    personaRequest().flush(persona);
    fixture.detectChanges();

    const assignedGrids = fixture.nativeElement.querySelectorAll('.roles-grid');

    expect(assignedGrids[0].textContent).toContain('PROPIETARIO');
    expect(assignedGrids[0].textContent).toContain('Protegido');
    expect(assignedGrids[0].textContent).toContain('Activo');
    expect(assignedGrids[0].querySelectorAll('.role-badges')).toHaveLength(1);
  });

  it('keeps the assigned roles empty state when the user has no assignments', () => {
    initial();

    const userButton = fixture.nativeElement.querySelector(
      '[aria-label="Usuarios disponibles"] button',
    ) as HTMLButtonElement;
    userButton.click();
    http.expectOne('/api/v1/usuarios/ana/roles').flush([]);
    personaRequest().flush(persona);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Este usuario no tiene Roles asignados.');
    expect(fixture.nativeElement.querySelectorAll('.role-action-remove')).toHaveLength(0);
  });

  it('keeps both grids separated when the catalog contains several roles', () => {
    const catalogRoles: readonly Rol[] = [
      ...roles,
      { codr: 3, nombre: 'ELECTRICISTA', estado: 1 },
      { codr: 4, nombre: 'INQUILINO', estado: 1 },
      { codr: 5, nombre: 'SUPERVISOR', estado: 1 },
    ];

    fixture.detectChanges();
    usersRequest().flush(usersPage);
    rolesRequest().flush({ ...rolesPage, content: catalogRoles, totalElements: 5 });
    fixture.detectChanges();

    const userButton = fixture.nativeElement.querySelector(
      '[aria-label="Usuarios disponibles"] button',
    ) as HTMLButtonElement;
    userButton.click();
    http.expectOne('/api/v1/usuarios/ana/roles').flush([roles[0]]);
    personaRequest().flush(persona);
    fixture.detectChanges();

    const roleGrids = fixture.nativeElement.querySelectorAll('.roles-grid');

    expect(roleGrids).toHaveLength(2);
    expect(roleGrids[0].querySelectorAll('.role-card')).toHaveLength(1);
    expect(roleGrids[1].querySelectorAll('.role-card')).toHaveLength(4);
    expect(
      fixture.nativeElement.querySelectorAll('nav[aria-label*="Paginación de Roles"]'),
    ).toHaveLength(0);
  });

  it('places the available-role search in the section heading', () => {
    const availableSection = selectedUserWithRoles(roles);
    const heading = availableSection.querySelector('.role-section-heading') as HTMLElement;
    const searchInput = heading.querySelector('#available-role-search') as HTMLInputElement;

    expect(heading).not.toBeNull();
    expect(heading.querySelector('.role-section-tools')).not.toBeNull();
    expect(searchInput.placeholder).toBe('Buscar rol por nombre o código...');
    expect(heading.querySelector('label[for="available-role-search"]')).not.toBeNull();
  });

  it('filters available roles by name in real time', () => {
    const availableSection = selectedUserWithRoles([
      ...roles,
      { codr: 782, nombre: 'ELECTRICISTA', estado: 1 },
    ]);
    const searchInput = availableSection.querySelector(
      '#available-role-search',
    ) as HTMLInputElement;

    searchInput.value = 'admin';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(availableSection.querySelectorAll('.role-card')).toHaveLength(1);
    expect(availableSection.textContent).toContain('ADMINISTRADOR');
    expect(availableSection.textContent).not.toContain('ELECTRICISTA');
  });

  it('filters available roles by code in real time', () => {
    const availableSection = selectedUserWithRoles([
      ...roles,
      { codr: 782, nombre: 'ELECTRICISTA', estado: 1 },
    ]);
    const searchInput = availableSection.querySelector(
      '#available-role-search',
    ) as HTMLInputElement;

    searchInput.value = '782';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(availableSection.querySelectorAll('.role-card')).toHaveLength(1);
    expect(availableSection.textContent).toContain('ELECTRICISTA');
    expect(availableSection.textContent).not.toContain('ADMINISTRADOR');
  });

  it('shows the no-results state when no available role matches the search', () => {
    const availableSection = selectedUserWithRoles(roles);
    const searchInput = availableSection.querySelector(
      '#available-role-search',
    ) as HTMLInputElement;

    searchInput.value = 'inexistente';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(availableSection.querySelectorAll('.role-card')).toHaveLength(0);
    expect(availableSection.textContent).toContain('No se encontraron roles disponibles.');
  });

  it('places the assigned-role search in the section heading', () => {
    const assignedSection = selectedUserWithAssignedRoles(roles);
    const heading = assignedSection.querySelector('.role-section-heading') as HTMLElement;
    const searchInput = heading.querySelector('#assigned-role-search') as HTMLInputElement;

    expect(heading).not.toBeNull();
    expect(heading.querySelector('.role-section-tools')).not.toBeNull();
    expect(searchInput.placeholder).toBe('Buscar rol por nombre o código...');
    expect(heading.querySelector('label[for="assigned-role-search"]')).not.toBeNull();
  });

  it('filters assigned roles by name in real time', () => {
    const assignedSection = selectedUserWithAssignedRoles(roles);
    const searchInput = assignedSection.querySelector('#assigned-role-search') as HTMLInputElement;

    searchInput.value = 'admin';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(assignedSection.querySelectorAll('.role-card')).toHaveLength(1);
    expect(assignedSection.textContent).toContain('ADMINISTRADOR');
    expect(assignedSection.textContent).not.toContain('PROPIETARIO');
  });

  it('filters assigned roles by code in real time', () => {
    const assignedSection = selectedUserWithAssignedRoles(roles);
    const searchInput = assignedSection.querySelector('#assigned-role-search') as HTMLInputElement;

    searchInput.value = '2';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(assignedSection.querySelectorAll('.role-card')).toHaveLength(1);
    expect(assignedSection.textContent).toContain('Código #2');
    expect(assignedSection.textContent).toContain('ADMINISTRADOR');
    expect(assignedSection.textContent).not.toContain('PROPIETARIO');
  });

  it('restores all assigned roles when the search text is empty', () => {
    const assignedSection = selectedUserWithAssignedRoles(roles);
    const searchInput = assignedSection.querySelector('#assigned-role-search') as HTMLInputElement;

    searchInput.value = 'admin';
    searchInput.dispatchEvent(new Event('input'));
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(assignedSection.querySelectorAll('.role-card')).toHaveLength(2);
    expect(assignedSection.textContent).not.toContain('No se encontraron roles asignados.');
  });

  it('shows the no-results state when no assigned role matches the search', () => {
    const assignedSection = selectedUserWithAssignedRoles(roles);
    const searchInput = assignedSection.querySelector('#assigned-role-search') as HTMLInputElement;

    searchInput.value = 'inexistente';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(assignedSection.querySelectorAll('.role-card')).toHaveLength(0);
    expect(assignedSection.textContent).toContain('No se encontraron roles asignados.');
  });

  it('filters among several assigned roles without changing assignment actions', () => {
    const catalogRoles: readonly Rol[] = [
      ...roles,
      { codr: 3, nombre: 'ELECTRICISTA', estado: 1 },
      { codr: 4, nombre: 'INQUILINO', estado: 1 },
    ];
    const assignedSection = selectedUserWithAssignedRoles(catalogRoles, catalogRoles);
    const searchInput = assignedSection.querySelector('#assigned-role-search') as HTMLInputElement;

    searchInput.value = 'electric';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(assignedSection.querySelectorAll('.role-card')).toHaveLength(1);
    expect(assignedSection.textContent).toContain('ELECTRICISTA');
    expect(assignedSection.querySelectorAll('.role-action-remove')).toHaveLength(1);
  });

  it('paginates assigned roles independently with four cards per page', () => {
    const catalogRoles: readonly Rol[] = [
      ...roles,
      { codr: 3, nombre: 'ELECTRICISTA', estado: 1 },
      { codr: 4, nombre: 'INQUILINO', estado: 1 },
      { codr: 5, nombre: 'SUPERVISOR', estado: 1 },
    ];

    fixture.detectChanges();
    usersRequest().flush(usersPage);
    rolesRequest().flush({ ...rolesPage, content: catalogRoles, totalElements: 5 });
    fixture.detectChanges();

    const userButton = fixture.nativeElement.querySelector(
      '[aria-label="Usuarios disponibles"] button',
    ) as HTMLButtonElement;
    userButton.click();
    http.expectOne('/api/v1/usuarios/ana/roles').flush(catalogRoles);
    personaRequest().flush(persona);
    fixture.detectChanges();

    const assignedGrid = fixture.nativeElement.querySelectorAll('.roles-grid')[0] as HTMLElement;
    const pagination = fixture.nativeElement.querySelector(
      'nav[aria-label="Paginación de Roles asignados"]',
    ) as HTMLElement;

    expect(assignedGrid.querySelectorAll('.role-card')).toHaveLength(4);
    expect(pagination.textContent).toContain('Página 1 de 2');

    (pagination.querySelectorAll('button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(assignedGrid.querySelectorAll('.role-card')).toHaveLength(1);
    expect(pagination.textContent).toContain('Página 2 de 2');
  });

  it('paginates available roles independently when more than four remain', () => {
    const catalogRoles: readonly Rol[] = [
      ...roles,
      { codr: 3, nombre: 'ELECTRICISTA', estado: 1 },
      { codr: 4, nombre: 'INQUILINO', estado: 1 },
      { codr: 5, nombre: 'SUPERVISOR', estado: 1 },
      { codr: 6, nombre: 'AUDITOR', estado: 1 },
    ];

    fixture.detectChanges();
    usersRequest().flush(usersPage);
    rolesRequest().flush({ ...rolesPage, content: catalogRoles, totalElements: 6 });
    fixture.detectChanges();

    const userButton = fixture.nativeElement.querySelector(
      '[aria-label="Usuarios disponibles"] button',
    ) as HTMLButtonElement;
    userButton.click();
    http.expectOne('/api/v1/usuarios/ana/roles').flush([]);
    personaRequest().flush(persona);
    fixture.detectChanges();

    const availableGrid = fixture.nativeElement.querySelectorAll('.roles-grid')[0] as HTMLElement;
    const pagination = fixture.nativeElement.querySelector(
      'nav[aria-label="Paginación de Roles disponibles"]',
    ) as HTMLElement;

    expect(availableGrid.querySelectorAll('.role-card')).toHaveLength(4);
    expect(pagination.textContent).toContain('Página 1 de 2');

    (pagination.querySelectorAll('button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(availableGrid.querySelectorAll('.role-card')).toHaveLength(2);
    expect(pagination.textContent).toContain('Página 2 de 2');
  });

  it('assigns a role and refreshes the selected user roles', () => {
    initial();
    const userButton = fixture.nativeElement.querySelector(
      '[aria-label="Usuarios disponibles"] button',
    ) as HTMLButtonElement;
    userButton.click();
    http.expectOne('/api/v1/usuarios/ana/roles').flush([roles[1]]);
    personaRequest().flush(persona);
    fixture.detectChanges();

    const assignButton = fixture.nativeElement.querySelector(
      '.role-action-assign',
    ) as HTMLButtonElement;
    assignButton.click();
    const request = http.expectOne('/api/v1/usuarios/ana/roles/1');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    request.flush({});

    expect(notification.success).toHaveBeenCalledWith('Rol asignado correctamente.');
    http.expectOne('/api/v1/usuarios/ana/roles').flush(roles);
  });

  it('shows ProblemDetail when the users endpoint fails', () => {
    fixture.detectChanges();
    usersRequest().flush(
      { detail: 'No tiene permiso para consultar los Usuarios.' },
      { status: 403, statusText: 'Forbidden' },
    );
    rolesRequest().flush(rolesPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'No tiene permiso para consultar los Usuarios.',
    );
    expect(fixture.nativeElement.textContent).not.toContain('Datos personales no disponibles');
  });

  it('removes a role and reports the action error without closing the view', () => {
    initial();
    const userButton = fixture.nativeElement.querySelector(
      '[aria-label="Usuarios disponibles"] button',
    ) as HTMLButtonElement;
    userButton.click();
    http.expectOne('/api/v1/usuarios/ana/roles').flush([roles[1]]);
    personaRequest().flush(persona);
    fixture.detectChanges();

    const removeButton = fixture.nativeElement.querySelector(
      '.role-action-remove',
    ) as HTMLButtonElement;
    removeButton.click();
    const request = http.expectOne('/api/v1/usuarios/ana/roles/2');
    expect(request.request.method).toBe('DELETE');
    request.flush(
      { detail: 'No puede retirar este Rol.' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(notification.error).toHaveBeenCalledWith('No puede retirar este Rol.');
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'No puede retirar este Rol.',
    );
  });

  it('builds the full name while omitting unavailable surnames', () => {
    initial();

    const component = fixture.componentInstance as never as {
      fullName(value: Persona): string;
    };

    expect(component.fullName(persona)).toBe('Ana Paz Mendoza');
    expect(component.fullName({ ...persona, am: null })).toBe('Ana Paz');
    expect(component.fullName({ ...persona, ap: null, am: 'Mendoza' })).toBe('Ana Mendoza');
  });

  it('shows the personal-information loading state while Persona is requested', () => {
    initial();

    const userButton = fixture.nativeElement.querySelector(
      '[aria-label="Usuarios disponibles"] button',
    ) as HTMLButtonElement;
    userButton.click();
    http.expectOne('/api/v1/usuarios/ana/roles').flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Cargando información personal...');
    personaRequest().flush(persona);
  });

  it('shows an error while keeping the selected user available when Persona cannot load', () => {
    initial();

    const userButton = fixture.nativeElement.querySelector(
      '[aria-label="Usuarios disponibles"] button',
    ) as HTMLButtonElement;
    userButton.click();
    http.expectOne('/api/v1/usuarios/ana/roles').flush([]);
    personaRequest().flush(
      { detail: 'No fue posible cargar la Persona.' },
      { status: 404, statusText: 'Not Found' },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('ana');
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'No fue posible cargar la Persona.',
    );
  });
});
