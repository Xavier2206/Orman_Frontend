import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';

import { PersonasListComponent } from './personas-list.component';

describe('PersonasListComponent', () => {
  let fixture: ComponentFixture<PersonasListComponent>;
  let http: HttpTestingController;
  const notification = {
    success: vi.fn(),
  };
  const persona = {
    codper: 7,
    ci: '123',
    nombre: 'Ana',
    ap: 'Paz',
    am: null,
    genero: 'F' as const,
    estado: 1 as const,
    correo: 'ana@test.com',
    telefono: '70000000',
    tipoPersona: 'A' as const,
    foto: null,
    fechaRegistro: '2026-01-01T00:00:00Z',
    usuario: null,
    acciones: {
      puedeEditar: true,
      puedeDesactivar: true,
      puedeActivar: false,
      puedeEliminar: false,
      puedeCrearUsuario: true,
      puedeCambiarPassword: true,
    },
  };
  const page = {
    content: [persona],
    page: 0,
    size: 10,
    totalElements: 1,
    totalPages: 1,
    first: true,
    last: true,
  };
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonasListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OrmanNotificationService, useValue: notification },
      ],
    }).compileComponents();
    vi.clearAllMocks();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PersonasListComponent);
  });
  afterEach(() => http.verify());
  function initial(): void {
    http
      .expectOne('/api/v1/personas/resumen')
      .flush({ totalPersonas: 1, activas: 1, inactivas: 0, conUsuario: 0 });
    http.expectOne((r) => r.url === '/api/v1/personas').flush(page);
    fixture.detectChanges();
  }
  it('loads the list and independent summary', () => {
    initial();
    expect(fixture.nativeElement.textContent).toContain('Total Personas');
    expect(fixture.nativeElement.textContent).toContain('Ana Paz');
  });
  it('renders the clean heading and contextual pagination controls', () => {
    initial();
    const heading = fixture.nativeElement.querySelector('#personas-title') as HTMLElement;
    const pagination = fixture.nativeElement.querySelector(
      '[aria-label="Paginación de personas"]',
    ) as HTMLElement;

    expect(heading.textContent?.trim()).toBe('Gestionar Personas');
    expect(heading.previousElementSibling).toBeNull();
    expect(pagination.textContent).toContain('1 personas');
    expect(pagination.textContent).toContain('Página 1 de 1');
    const icons = pagination.querySelectorAll('mat-icon');
    expect(icons[0]?.textContent?.trim()).toBe('chevron_left');
    expect(icons[1]?.textContent?.trim()).toBe('chevron_right');
    expect(pagination.querySelectorAll('button[disabled]').length).toBe(2);
  });
  it('requests the next page using the incremented page index', () => {
    http
      .expectOne('/api/v1/personas/resumen')
      .flush({ totalPersonas: 11, activas: 11, inactivas: 0, conUsuario: 0 });
    http.expectOne((request) => request.url === '/api/v1/personas').flush({
      ...page,
      totalElements: 11,
      totalPages: 2,
      last: false,
    });
    fixture.detectChanges();

    const nextButton = Array.from(
      fixture.nativeElement.querySelectorAll('.page-button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes('Siguiente'));

    nextButton?.click();

    const nextRequest = http.expectOne((request) => request.url === '/api/v1/personas');
    expect(nextRequest.request.params.get('page')).toBe('1');
    nextRequest.flush(page);
  });
  it('does not reload summary for filters', () => {
    initial();
    (fixture.componentInstance as never as { setType(v: string): void }).setType('A');
    http.expectOne((r) => r.url === '/api/v1/personas').flush(page);
    http.expectNone('/api/v1/personas/resumen');
  });
  it('coordinates a form save and refreshes summary for creation', () => {
    initial();
    const c = fixture.componentInstance as never as { submitPersona(v: unknown): void };
    c.submitPersona({
      request: {
        ci: '456',
        nombre: 'Bea',
        ap: 'Paz',
        am: null,
        genero: 'F',
        correo: 'bea@test.com',
        telefono: '71111111',
        tipoPersona: 'A',
        foto: null,
      },
      photo: null,
    });
    http.expectOne('/api/v1/personas').flush({ ...persona, codper: 8 });
    expect(notification.success).toHaveBeenCalledWith('Persona creada correctamente.');
    http
      .expectOne('/api/v1/personas/resumen')
      .flush({ totalPersonas: 2, activas: 2, inactivas: 0, conUsuario: 0 });
    http.expectOne((r) => r.url === '/api/v1/personas').flush(page);
  });
  it('notifies after a successful persona update', () => {
    initial();
    const c = fixture.componentInstance as never as {
      selected: { set(value: unknown): void };
      submitPersona(value: unknown): void;
    };
    c.selected.set(persona);

    c.submitPersona({
      request: {
        ci: persona.ci,
        nombre: persona.nombre,
        ap: persona.ap,
        am: persona.am,
        genero: persona.genero,
        correo: persona.correo,
        telefono: persona.telefono,
        tipoPersona: persona.tipoPersona,
        foto: persona.foto,
        estado: persona.estado,
      },
      photo: null,
    });

    const update = http.expectOne('/api/v1/personas/7');
    expect(update.request.method).toBe('PUT');
    update.flush(persona);

    expect(notification.success).toHaveBeenCalledWith('Persona actualizada correctamente.');
    http.expectOne((request) => request.url === '/api/v1/personas').flush(page);
    http.expectNone('/api/v1/personas/resumen');
  });

  it('notifies after successfully deactivating a persona and refreshes the view', () => {
    initial();
    const c = fixture.componentInstance as never as {
      modal: { (): string | null };
      openConfirm(value: typeof persona): void;
      submitStatus(): void;
    };

    c.openConfirm(persona);
    fixture.detectChanges();
    c.submitStatus();

    const request = http.expectOne('/api/v1/personas/7/desactivar');
    expect(request.request.method).toBe('PATCH');
    request.flush({ ...persona, estado: 0 });

    expect(notification.success).toHaveBeenCalledWith('Persona desactivada correctamente.');
    expect(c.modal()).toBeNull();

    http.expectOne((request) => request.url === '/api/v1/personas').flush(page);
    http
      .expectOne('/api/v1/personas/resumen')
      .flush({ totalPersonas: 1, activas: 0, inactivas: 1, conUsuario: 0 });
  });

  it('notifies after successfully reactivating a persona and refreshes the view', () => {
    initial();
    const inactivePersona = { ...persona, estado: 0 as const };
    const c = fixture.componentInstance as never as {
      modal: { (): string | null };
      openConfirm(value: typeof inactivePersona): void;
      submitStatus(): void;
    };

    c.openConfirm(inactivePersona);
    fixture.detectChanges();
    c.submitStatus();

    const request = http.expectOne('/api/v1/personas/7/activar');
    expect(request.request.method).toBe('PATCH');
    request.flush({ ...inactivePersona, estado: 1 });

    expect(notification.success).toHaveBeenCalledWith('Persona reactivada correctamente.');
    expect(c.modal()).toBeNull();

    http.expectOne((request) => request.url === '/api/v1/personas').flush(page);
    http
      .expectOne('/api/v1/personas/resumen')
      .flush({ totalPersonas: 1, activas: 1, inactivas: 0, conUsuario: 0 });
  });

  it('keeps the status modal open and shows ProblemDetail feedback on status errors', () => {
    initial();
    const c = fixture.componentInstance as never as {
      submitting: { (): boolean };
      openConfirm(value: typeof persona): void;
      submitStatus(): void;
    };
    const errorCases = [
      { status: 404, statusText: 'Not Found', detail: 'La Persona no existe.' },
      { status: 403, statusText: 'Forbidden', detail: 'No tiene permiso para realizar la operación.' },
      { status: 409, statusText: 'Conflict', detail: 'Debe existir otro propietario.' },
    ];

    for (const errorCase of errorCases) {
      c.openConfirm(persona);
      fixture.detectChanges();
      c.submitStatus();

      http.expectOne('/api/v1/personas/7/desactivar').flush(
        { detail: errorCase.detail, errorCode: 'STATUS_ERROR' },
        { status: errorCase.status, statusText: errorCase.statusText },
      );
      fixture.detectChanges();

      const modal = fixture.nativeElement.querySelector(
        'app-persona-status-confirm-modal',
      ) as HTMLElement;
      const dialog = modal.querySelector('[role="dialog"]') as HTMLElement;
      const alert = modal.querySelector('[role="alert"]') as HTMLElement;

      expect(modal).not.toBeNull();
      expect(alert.textContent).toContain(errorCase.detail);
      expect(dialog.getAttribute('aria-describedby')).toBe(
        'persona-status-description persona-status-error',
      );
      expect(dialog.getAttribute('aria-busy')).toBe('false');
      expect(c.submitting()).toBe(false);
      expect(notification.success).not.toHaveBeenCalled();
    }
  });

  it('keeps backend field errors inline without showing a success notification', () => {
    initial();
    const c = fixture.componentInstance as never as {
      fieldErrors: { (): Record<string, string> };
      submitPersona(value: unknown): void;
    };

    c.submitPersona({
      request: {
        ci: '456',
        nombre: 'Bea',
        ap: 'Paz',
        am: null,
        genero: 'F',
        correo: 'bea@test.com',
        telefono: '71111111',
        tipoPersona: 'A',
        foto: null,
      },
      photo: null,
    });

    http.expectOne('/api/v1/personas').flush(
      {
        detail: 'El CI ya está registrado.',
        fieldErrors: [{ field: 'ci', message: 'El CI ya está registrado.' }],
      },
      { status: 409, statusText: 'Conflict' },
    );

    expect(c.fieldErrors()['ci']).toBe('El CI ya está registrado.');
    expect(notification.success).not.toHaveBeenCalled();
  });

  it('does not notify success when a persona update fails', () => {
    initial();
    const c = fixture.componentInstance as never as {
      selected: { set(value: unknown): void };
      submitPersona(value: unknown): void;
    };
    c.selected.set(persona);

    c.submitPersona({
      request: {
        ci: persona.ci,
        nombre: persona.nombre,
        ap: persona.ap,
        am: persona.am,
        genero: persona.genero,
        correo: persona.correo,
        telefono: persona.telefono,
        tipoPersona: persona.tipoPersona,
        foto: persona.foto,
        estado: persona.estado,
      },
      photo: null,
    });

    http
      .expectOne('/api/v1/personas/7')
      .flush(
        { detail: 'No fue posible actualizar la Persona.' },
        { status: 500, statusText: 'Error' },
      );

    expect(notification.success).not.toHaveBeenCalled();
  });
  it('does not repeat POST when a photo upload fails after creation', () => {
    initial();
    const c = fixture.componentInstance as never as {
      feedback: { (): string | null };
      selected: { (): { codper: number } | null };
      submitPersona(v: unknown): void;
    };
    const submission = {
      request: {
        ci: '456',
        nombre: 'Bea',
        ap: 'Paz',
        am: null,
        genero: 'F' as const,
        correo: 'bea@test.com',
        telefono: '71111111',
        tipoPersona: 'A' as const,
        foto: null,
      },
      photo: new File(['jpeg'], 'persona.jpg', { type: 'image/jpeg' }),
    };

    c.submitPersona(submission);
    http.expectOne('/api/v1/personas').flush({ ...persona, codper: 8 });
    http
      .expectOne('/api/v1/personas/8/foto')
      .flush({ detail: 'No se pudo guardar la foto.' }, { status: 500, statusText: 'Error' });
    http
      .expectOne('/api/v1/personas/resumen')
      .flush({ totalPersonas: 2, activas: 2, inactivas: 0, conUsuario: 0 });
    http.expectOne((r) => r.url === '/api/v1/personas').flush(page);

    expect(c.selected()?.codper).toBe(8);
    expect(c.feedback()).toContain('La Persona fue creada correctamente');
    expect(notification.success).not.toHaveBeenCalled();

    c.submitPersona(submission);
    const update = http.expectOne('/api/v1/personas/8');
    expect(update.request.method).toBe('PUT');
    update.flush({ ...persona, codper: 8 });
    http.expectOne('/api/v1/personas/8/foto').flush({ ...persona, codper: 8, foto: 'foto.jpg' });
    http.expectOne((r) => r.url === '/api/v1/personas').flush(page);
    http.expectNone('/api/v1/personas/resumen');
  });
  it('synchronizes selected.foto after a successful photo deletion', () => {
    initial();
    const c = fixture.componentInstance as never as {
      removePhoto(): void;
      selected: {
        (): { foto: string | null } | null;
        set(value: unknown): void;
      };
    };
    c.selected.set({ ...persona, foto: 'persona.jpg' });

    c.removePhoto();

    http.expectOne('/api/v1/personas/7/foto').flush(null);
    http.expectNone((r) => r.url === '/api/v1/personas');
    expect(c.selected()?.foto).toBeNull();
  });
  it('coordinates a password update without summary refresh', () => {
    initial();
    const c = fixture.componentInstance as never as {
      selected: { set(v: unknown): void };
      submitPassword(v: { newPassword: string }): void;
    };
    c.selected.set({ ...persona, usuario: { login: 'ana', estado: 1 } });
    c.submitPassword({ newPassword: 'password-1' });
    http.expectOne('/api/v1/usuarios/ana/password').flush({});
    http.expectOne((r) => r.url === '/api/v1/personas').flush(page);
    http.expectNone('/api/v1/personas/resumen');
  });
  it('opens the extracted form modal', () => {
    initial();
    (fixture.componentInstance as never as { openCreate(): void }).openCreate();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-persona-form-modal')).toBeTruthy();
  });
  it('passes the authenticated object URL to the detail modal', () => {
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:persona-7');
    const photoPage = {
      ...page,
      content: [{ ...persona, foto: 'persona-photo.jpg' }],
    };

    http
      .expectOne('/api/v1/personas/resumen')
      .flush({ totalPersonas: 1, activas: 1, inactivas: 0, conUsuario: 0 });
    http.expectOne((r) => r.url === '/api/v1/personas').flush(photoPage);
    http.expectOne('/api/v1/personas/7/foto').flush(new Blob(['photo'], { type: 'image/jpeg' }));

    const c = fixture.componentInstance as never as {
      openDetail(persona: typeof photoPage.content[number]): void;
    };
    c.openDetail(photoPage.content[0]);
    fixture.detectChanges();

    const photo = fixture.nativeElement.querySelector('.profile-avatar img') as HTMLImageElement;
    expect(photo.src).toContain('blob:persona-7');

    createObjectUrl.mockRestore();
  });
  it('exposes the available card actions in the mobile menu', () => {
    initial();
    const c = fixture.componentInstance as never as { toggleMobileMenu(codper: number): void };
    c.toggleMobileMenu(persona.codper);
    fixture.detectChanges();
    const menu = fixture.nativeElement.querySelector('[role="menu"]');
    expect(menu).toBeTruthy();
    expect(menu.textContent).toContain('Editar');
    expect(menu.textContent).toContain('Detalle');
    expect(menu.textContent).toContain('Dar de baja');
    expect(menu.textContent).toContain('Crear usuario');
  });
});
