import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { PageResponse } from '../../../personas/models/persona.model';
import { Rol, RolResumen } from '../../models/rol.model';
import { RolesListComponent } from './roles-list.component';

describe('RolesListComponent actions', () => {
  let fixture: ComponentFixture<RolesListComponent>;
  let http: HttpTestingController;
  const notification = { success: vi.fn() };
  const activeRole: Rol = { codr: 2, nombre: 'ADMINISTRADOR', estado: 1 };
  const inactiveRole: Rol = { codr: 3, nombre: 'LECTURA', estado: 0 };
  const ownerRole: Rol = { codr: 1, nombre: 'PROPIETARIO', estado: 1 };
  const summary: RolResumen = { totalRoles: 3, activos: 2, inactivos: 1 };
  const page: PageResponse<Rol> = {
    content: [ownerRole, activeRole, inactiveRole],
    page: 0,
    size: 10,
    totalElements: 3,
    totalPages: 1,
    first: true,
    last: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolesListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OrmanNotificationService, useValue: notification },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RolesListComponent);
    vi.clearAllMocks();
  });

  afterEach(() => http.verify());

  function listRequest(): ReturnType<HttpTestingController['expectOne']> {
    return http.expectOne((request) => request.url === '/api/v1/roles');
  }

  function initial(): void {
    fixture.detectChanges();
    listRequest().flush(page);
    http.expectOne('/api/v1/roles/resumen').flush(summary);
    fixture.detectChanges();
  }

  it('opens the create form and creates a Role only after backend success', () => {
    initial();
    const component = fixture.componentInstance as never as {
      openCreate(): void;
      submitRol(request: { nombre: string; estado?: 0 | 1 }): void;
      modal: () => string | null;
    };

    component.openCreate();
    fixture.detectChanges();
    expect(component.modal()).toBe('form');
    expect(fixture.nativeElement.querySelector('app-rol-form-modal')).toBeTruthy();

    component.submitRol({ nombre: 'SUPERVISOR', estado: 1 });
    const request = http.expectOne('/api/v1/roles');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ nombre: 'SUPERVISOR', estado: 1 });
    request.flush({ codr: 4, nombre: 'SUPERVISOR', estado: 1 });

    expect(notification.success).toHaveBeenCalledWith('Rol creado correctamente.');
    listRequest().flush(page);
    http.expectOne('/api/v1/roles/resumen').flush({ ...summary, totalRoles: 4, activos: 3 });
  });

  it('keeps the create modal open and shows field feedback on a duplicate name', () => {
    initial();
    const component = fixture.componentInstance as never as {
      openCreate(): void;
      submitRol(request: { nombre: string; estado?: 0 | 1 }): void;
      modal: () => string | null;
      submitting: () => boolean;
    };
    component.openCreate();
    component.submitRol({ nombre: 'ADMINISTRADOR', estado: 1 });
    http.expectOne('/api/v1/roles').flush(
      {
        detail: 'El nombre del Rol ya está registrado.',
        fieldErrors: [{ field: 'nombre', message: 'El nombre del Rol ya está registrado.' }],
      },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(component.modal()).toBe('form');
    expect(component.submitting()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'El nombre del Rol ya está registrado.',
    );
    expect(notification.success).not.toHaveBeenCalled();
  });

  it('updates only the role name and does not reload the summary', () => {
    initial();
    const component = fixture.componentInstance as never as {
      openEdit(role: Rol): void;
      submitRol(request: { nombre: string; estado?: 0 | 1 }): void;
    };
    component.openEdit(activeRole);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Código #2');
    expect(fixture.nativeElement.querySelector('#role-initial-state')).toBeNull();

    component.submitRol({ nombre: 'COORDINADOR', estado: 0 });
    const request = http.expectOne('/api/v1/roles/2');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ nombre: 'COORDINADOR' });
    request.flush({ codr: 2, nombre: 'COORDINADOR', estado: 1 });

    expect(notification.success).toHaveBeenCalledWith('Rol actualizado correctamente.');
    listRequest().flush(page);
    http.expectNone('/api/v1/roles/resumen');
  });

  it('deactivates and reactivates Roles after confirmation, refreshing list and summary', () => {
    initial();
    const component = fixture.componentInstance as never as {
      openStatus(role: Rol): void;
      submitStatus(): void;
    };

    component.openStatus(activeRole);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Desactivar Rol');
    component.submitStatus();
    const deactivate = http.expectOne('/api/v1/roles/2/desactivar');
    expect(deactivate.request.method).toBe('PATCH');
    deactivate.flush({ ...activeRole, estado: 0 });
    expect(notification.success).toHaveBeenCalledWith('Rol desactivado correctamente.');
    listRequest().flush(page);
    http.expectOne('/api/v1/roles/resumen').flush({ ...summary, activos: 1, inactivos: 2 });

    component.openStatus(inactiveRole);
    component.submitStatus();
    const activate = http.expectOne('/api/v1/roles/3/activar');
    expect(activate.request.method).toBe('PATCH');
    activate.flush({ ...inactiveRole, estado: 1 });
    expect(notification.success).toHaveBeenCalledWith('Rol reactivado correctamente.');
    listRequest().flush(page);
    http.expectOne('/api/v1/roles/resumen').flush(summary);
  });

  it('keeps the status modal open without a success toast when the backend fails', () => {
    initial();
    const component = fixture.componentInstance as never as {
      openStatus(role: Rol): void;
      submitStatus(): void;
      modal: () => string | null;
      submitting: () => boolean;
    };
    component.openStatus(activeRole);
    component.submitStatus();
    http.expectOne('/api/v1/roles/2/desactivar').flush(
      {
        detail: 'No puede desactivar el último Rol propietario.',
        errorCode: 'LAST_OWNER_REQUIRED',
      },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(component.modal()).toBe('status');
    expect(component.submitting()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'No puede desactivar el último Rol propietario.',
    );
    expect(notification.success).not.toHaveBeenCalled();
  });

  it('does not offer edit or deactivate for active PROPIETARIO but permits reactivation when inactive', () => {
    initial();
    const ownerCard = fixture.nativeElement.querySelector('.role-card') as HTMLElement;
    const deactivateIcons = fixture.nativeElement.querySelectorAll(
      '[aria-label="Desactivar Rol"] mat-icon',
    ) as NodeListOf<HTMLElement>;

    expect(ownerCard.textContent).toContain('Protegido');
    expect(ownerCard.querySelector('.actions-divider')).toBeNull();
    expect(Array.from(deactivateIcons)).toHaveLength(1);
    expect(
      Array.from(deactivateIcons).every((icon) => icon.textContent?.trim() === 'delete_outline'),
    ).toBe(true);

    const component = fixture.componentInstance as never as {
      openStatus(role: Rol): void;
      modal: () => string | null;
    };
    component.openStatus({ ...ownerRole, estado: 0 });
    fixture.detectChanges();
    expect(component.modal()).toBe('status');
    expect(fixture.nativeElement.textContent).toContain('Reactivar Rol');
  });
});
