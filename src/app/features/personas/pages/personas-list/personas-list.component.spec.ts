import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PersonasListComponent } from './personas-list.component';

describe('PersonasListComponent', () => {
  let fixture: ComponentFixture<PersonasListComponent>;
  let http: HttpTestingController;
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
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
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
        ap: null,
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
    http
      .expectOne('/api/v1/personas/resumen')
      .flush({ totalPersonas: 2, activas: 2, inactivas: 0, conUsuario: 0 });
    http.expectOne((r) => r.url === '/api/v1/personas').flush(page);
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
