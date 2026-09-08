import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { PageResponse } from '../../../personas/models/persona.model';
import { Menu, MenuResumen } from '../../models/menu.model';
import { MenusListComponent } from './menus-list.component';

describe('MenusListComponent actions', () => {
  let fixture: ComponentFixture<MenusListComponent>;
  let http: HttpTestingController;
  const notification = { success: vi.fn() };
  const activeMenu: Menu = {
    codm: 2,
    nombre: 'CONTROL DE ACCESO',
    icono: 'admin_panel_settings',
    estado: 1,
  };
  const inactiveMenu: Menu = {
    codm: 3,
    nombre: 'REPORTES',
    icono: null,
    estado: 0,
  };
  const summary: MenuResumen = { totalMenus: 2, activos: 1, inactivos: 1 };
  const page: PageResponse<Menu> = {
    content: [activeMenu, inactiveMenu],
    page: 0,
    size: 10,
    totalElements: 2,
    totalPages: 1,
    first: true,
    last: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenusListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OrmanNotificationService, useValue: notification },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MenusListComponent);
    notification.success.mockClear();
  });

  afterEach(() => {
    http.verify();
  });

  function listRequest(): ReturnType<HttpTestingController['expectOne']> {
    return http.expectOne((request) => request.url === '/api/v1/menus');
  }

  function initial(): void {
    fixture.detectChanges();
    listRequest().flush(page);
    http.expectOne('/api/v1/menus/resumen').flush(summary);
    fixture.detectChanges();
  }

  it('opens the create form from Añadir Menú and reloads list and summary after success', () => {
    initial();
    const component = fixture.componentInstance as never as {
      submitMenu(submission: {
        mode: 'create';
        request: { nombre: string; icono: string | null; estado: 0 | 1 };
      }): void;
    };

    (fixture.nativeElement.querySelector('[aria-label="Añadir Menú"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-menu-form-modal')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Crear Menú');

    component.submitMenu({
      mode: 'create',
      request: { nombre: 'NUEVO MENÚ', icono: 'settings', estado: 1 },
    });
    const request = http.expectOne('/api/v1/menus');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nombre: 'NUEVO MENÚ',
      icono: 'settings',
      estado: 1,
    });
    request.flush({ codm: 4, nombre: 'NUEVO MENÚ', icono: 'settings', estado: 1 });

    expect(notification.success).toHaveBeenCalledWith('Menú creado correctamente.');
    listRequest().flush(page);
    http.expectOne('/api/v1/menus/resumen').flush({ ...summary, totalMenus: 3, activos: 2 });
  });

  it('edits a menu without sending estado and reloads only the list', () => {
    initial();
    const component = fixture.componentInstance as never as {
      openEdit(menu: Menu): void;
      submitMenu(submission: {
        mode: 'edit';
        request: { nombre: string; icono: string | null };
      }): void;
    };

    component.openEdit(activeMenu);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Editar Menú');
    expect(fixture.nativeElement.querySelector('#menu-initial-state-label')).toBeNull();

    component.submitMenu({
      mode: 'edit',
      request: { nombre: 'CONTROL ACTUALIZADO', icono: null },
    });
    const request = http.expectOne('/api/v1/menus/2');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      nombre: 'CONTROL ACTUALIZADO',
      icono: null,
    });
    expect(request.request.body).not.toHaveProperty('estado');
    request.flush({ ...activeMenu, nombre: 'CONTROL ACTUALIZADO', icono: null });

    expect(notification.success).toHaveBeenCalledWith('Menú actualizado correctamente.');
    listRequest().flush(page);
    http.expectNone('/api/v1/menus/resumen');
  });

  it('shows desktop actions according to the menu state', () => {
    initial();

    const activeCard = fixture.nativeElement.querySelectorAll('.menu-card')[0] as HTMLElement;
    const inactiveCard = fixture.nativeElement.querySelectorAll('.menu-card')[1] as HTMLElement;

    expect(activeCard.querySelector('[aria-label="Editar Menú"]')).toBeTruthy();
    expect(activeCard.querySelector('[aria-label="Desactivar Menú"]')).toBeTruthy();
    expect(activeCard.querySelector('[aria-label="Reactivar Menú"]')).toBeNull();
    expect(inactiveCard.querySelector('[aria-label="Editar Menú"]')).toBeTruthy();
    expect(inactiveCard.querySelector('[aria-label="Reactivar Menú"]')).toBeTruthy();
    expect(inactiveCard.querySelector('[aria-label="Desactivar Menú"]')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Eliminar Menú');
  });

  it('shows the mobile contextual actions with the correct state operation', () => {
    initial();

    const moreButtons = fixture.nativeElement.querySelectorAll(
      '[aria-label="Más acciones de Menú"]',
    ) as NodeListOf<HTMLButtonElement>;
    moreButtons[0].click();
    fixture.detectChanges();

    const menu = fixture.nativeElement.querySelector('[role="menu"]') as HTMLElement;
    expect(menu.querySelector('[role="menuitem"]')?.textContent).toContain('Editar Menú');
    expect(menu.textContent).toContain('Desactivar Menú');
    expect(menu.textContent).not.toContain('Eliminar Menú');
  });

  it('deactivates and reactivates menus, refreshing list and summary', () => {
    initial();
    const component = fixture.componentInstance as never as {
      openStatus(menu: Menu): void;
      submitStatus(): void;
    };

    component.openStatus(activeMenu);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Desactivar Menú');
    component.submitStatus();
    const deactivate = http.expectOne('/api/v1/menus/2/desactivar');
    expect(deactivate.request.method).toBe('PATCH');
    expect(deactivate.request.body).toBeNull();
    deactivate.flush({ ...activeMenu, estado: 0 });
    expect(notification.success).toHaveBeenCalledWith('Menú desactivado correctamente.');
    listRequest().flush(page);
    http.expectOne('/api/v1/menus/resumen').flush({ ...summary, activos: 0, inactivos: 2 });

    component.openStatus(inactiveMenu);
    component.submitStatus();
    const activate = http.expectOne('/api/v1/menus/3/activar');
    expect(activate.request.method).toBe('PATCH');
    expect(activate.request.body).toBeNull();
    activate.flush({ ...inactiveMenu, estado: 1 });
    expect(notification.success).toHaveBeenCalledWith('Menú reactivado correctamente.');
    listRequest().flush(page);
    http.expectOne('/api/v1/menus/resumen').flush(summary);
  });

  it('keeps status modal open and shows ProblemDetail without a success toast on error', () => {
    initial();
    const component = fixture.componentInstance as never as {
      openStatus(menu: Menu): void;
      submitStatus(): void;
      modal: () => string | null;
      submitting: () => boolean;
    };

    component.openStatus(activeMenu);
    component.submitStatus();
    http.expectOne('/api/v1/menus/2/desactivar').flush(
      { detail: 'No puede desactivar este Menú.' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(component.modal()).toBe('status');
    expect(component.submitting()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'No puede desactivar este Menú.',
    );
    expect(notification.success).not.toHaveBeenCalled();
  });
});
