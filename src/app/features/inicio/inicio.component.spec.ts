import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthContextService } from '../../core/auth/auth-context.service';
import { InicioComponent } from './inicio.component';

describe('InicioComponent', () => {
  let fixture: ComponentFixture<InicioComponent>;
  let context: AuthContextService;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    context = TestBed.inject(AuthContextService);
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(InicioComponent);
  });

  afterEach(() => http.verify());

  function renderRoles(roles: unknown[]): void {
    context.loadContext().subscribe();
    http.expectOne('/api/v1/auth/context').flush({
      usuario: { login: 'xavier', codper: 1 },
      persona: { nombre: 'Xavier', ap: 'Ortega', am: null, foto: null },
      roles,
    });
    fixture.detectChanges();
  }

  it('should show the private area construction state when navigation is available', () => {
    renderRoles([{ codr: 1, nombre: 'PROPIETARIO', menus: [{ codm: 1, nombre: 'PERSONAS', icono: 'group', procesos: [] }] }]);
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Área privada ORMAN');
    expect(fixture.nativeElement.textContent).toContain('Contenido en construcción');
  });

  it('should differentiate no roles from a role without menus', () => {
    renderRoles([]);
    expect(fixture.nativeElement.textContent).toContain('No tienes un rol asignado actualmente.');

    context.reloadContext().subscribe();
    http.expectOne('/api/v1/auth/context').flush({
      usuario: { login: 'xavier', codper: 1 },
      persona: { nombre: 'Xavier', ap: 'Ortega', am: null, foto: null },
      roles: [{ codr: 2, nombre: 'ADMINISTRADOR', menus: [] }],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay menús disponibles para este rol.');
  });
});
