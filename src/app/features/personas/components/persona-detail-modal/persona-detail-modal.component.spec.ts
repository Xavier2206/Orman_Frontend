import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PersonaDetailModalComponent } from './persona-detail-modal.component';
const p = {
  codper: 1,
  ci: '1',
  nombre: 'Ana',
  ap: 'Paz',
  am: null,
  genero: 'F' as const,
  estado: 1 as const,
  correo: 'a@test.com',
  telefono: '7',
  tipoPersona: 'A' as const,
  foto: null,
  fechaRegistro: '2026-01-01',
  usuario: null,
  acciones: {
    puedeEditar: true,
    puedeDesactivar: true,
    puedeActivar: false,
    puedeEliminar: false,
    puedeCrearUsuario: false,
    puedeCambiarPassword: false,
  },
};
describe('PersonaDetailModalComponent', () => {
  let f: ComponentFixture<PersonaDetailModalComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonaDetailModalComponent],
    }).compileComponents();
    f = TestBed.createComponent(PersonaDetailModalComponent);
    f.componentRef.setInput('persona', p);
  });
  it('renders person data', () => {
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Ana Paz');
  });
  it('renders no linked user', () => {
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Sin usuario vinculado');
  });
});
