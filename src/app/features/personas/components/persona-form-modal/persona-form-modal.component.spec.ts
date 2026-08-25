import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PersonaFormModalComponent } from './persona-form-modal.component';
describe('PersonaFormModalComponent', () => {
  let f: ComponentFixture<PersonaFormModalComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonaFormModalComponent],
    }).compileComponents();
    f = TestBed.createComponent(PersonaFormModalComponent);
  });
  it('renders create mode', () => {
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Añadir Persona');
  });
  it('emits a valid form submit', () => {
    const c = f.componentInstance as never as {
      form: { setValue(v: unknown): void };
      saved: { subscribe(v: (e: { request: { ci: string } }) => void): void };
      submit(): void;
    };
    c.form.setValue({
      ci: '1',
      nombre: 'Ana',
      ap: '',
      am: '',
      genero: 'F',
      correo: 'ana@test.com',
      telefono: '7',
      tipoPersona: 'A',
    });
    let ci = '';
    c.saved.subscribe((e) => (ci = e.request.ci));
    c.submit();
    expect(ci).toBe('1');
  });
  it('closes with Escape when no operation is in progress', () => {
    let closed = false;
    f.componentInstance.closed.subscribe(() => (closed = true));
    f.detectChanges();
    f.nativeElement
      .querySelector('[role="dialog"]')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(closed).toBe(true);
  });
});
