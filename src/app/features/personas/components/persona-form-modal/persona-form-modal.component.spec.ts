import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonaFormModalComponent } from './persona-form-modal.component';

type TestControl = {
  value: string;
  errors: Record<string, unknown> | null;
  markAsTouched(): void;
  setValue(value: string): void;
};

type FormModalHarness = {
  form: {
    controls: {
      ci: TestControl;
      nombre: TestControl;
      ap: TestControl;
      am: TestControl;
      genero: TestControl;
      correo: TestControl;
      telefono: TestControl;
      tipoPersona: TestControl;
    };
    invalid: boolean;
    setValue(value: {
      ci: string;
      nombre: string;
      ap: string;
      am: string;
      genero: 'F' | 'M' | '';
      correo: string;
      telefono: string;
      tipoPersona: 'A' | 'I' | '';
    }): void;
  };
  saved: {
    subscribe(callback: (event: { request: { ap: string | null; estado?: number } }) => void): void;
  };
  submit(): void;
};

describe('PersonaFormModalComponent', () => {
  let fixture: ComponentFixture<PersonaFormModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonaFormModalComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(PersonaFormModalComponent);
  });

  function component(): FormModalHarness {
    return fixture.componentInstance as never as FormModalHarness;
  }

  function setValidForm(): void {
    component().form.setValue({
      ci: '123',
      nombre: 'Ana',
      ap: 'Paz',
      am: '',
      genero: 'F',
      correo: 'ana@test.com',
      telefono: '70000000',
      tipoPersona: 'A',
    });
  }

  it('renders a neutral create form without anticipated errors', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Añadir Persona');
    expect(fixture.nativeElement.querySelector('.field-message-error')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('#persona-ci').getAttribute('aria-invalid'),
    ).toBeNull();
    expect(component().form.controls.genero.value).toBe('');
    expect(component().form.controls.tipoPersona.value).toBe('');
  });

  it('renders direct surname labels and one shared helper message', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('label[for="persona-ap"]').textContent).toContain(
      'Apellido paterno',
    );
    expect(fixture.nativeElement.querySelector('label[for="persona-am"]').textContent).toContain(
      'Apellido materno',
    );
    expect(fixture.nativeElement.querySelectorAll('#persona-surnames-help')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain(
      'Completa al menos uno de los dos apellidos.',
    );
    expect(fixture.nativeElement.textContent).not.toContain('Apellidos');
  });

  it('places initial focus on CI', async () => {
    fixture.detectChanges();

    await Promise.resolve();

    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#persona-ci'));
  });

  it('shows a local error under a touched invalid control with accessible metadata', () => {
    fixture.detectChanges();
    const c = component();
    c.form.controls.ci.markAsTouched();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#persona-ci') as HTMLInputElement;
    expect(input.classList.contains('field-error')).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('persona-ci-message');
    expect(fixture.nativeElement.querySelector('#persona-ci-message').textContent).toContain(
      'El CI es obligatorio.',
    );
  });

  it('shows a discrete valid state after a valid value is touched', () => {
    fixture.detectChanges();
    const c = component();
    c.form.controls.correo.setValue('ana@test.com');
    c.form.controls.correo.markAsTouched();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#persona-correo') as HTMLInputElement;
    expect(input.classList.contains('field-valid')).toBe(true);
    expect(
      fixture.nativeElement.querySelector('#persona-correo-valid-message').textContent,
    ).toContain('Correo válido.');
  });

  it('enforces required, email and maximum-length rules', () => {
    const c = component();
    c.form.controls.nombre.setValue('   ');
    c.form.controls.ci.setValue('c'.repeat(21));
    c.form.controls.correo.setValue('correo-invalido');
    c.form.controls.telefono.setValue('7'.repeat(21));
    c.form.controls.genero.setValue('');
    c.form.controls.tipoPersona.setValue('');

    expect(c.form.controls.nombre.errors?.['required']).toBeTruthy();
    expect(c.form.controls.ci.errors?.['maxlength']).toBeTruthy();
    expect(c.form.controls.correo.errors?.['email']).toBeTruthy();
    expect(c.form.controls.telefono.errors?.['maxlength']).toBeTruthy();
    expect(c.form.controls.genero.errors?.['required']).toBeTruthy();
    expect(c.form.controls.tipoPersona.errors?.['required']).toBeTruthy();
  });

  it('accepts either surname, both surnames, and rejects empty or blank pairs', () => {
    const c = component();
    setValidForm();

    c.form.controls.ap.setValue('Paz');
    c.form.controls.am.setValue('Ríos');
    expect(c.form.invalid).toBe(false);

    c.form.controls.am.setValue('');
    expect(c.form.invalid).toBe(false);

    c.form.controls.ap.setValue('');
    c.form.controls.am.setValue('Ríos');
    expect(c.form.invalid).toBe(false);

    c.form.controls.am.setValue('');
    expect(c.form.invalid).toBe(true);

    c.form.controls.ap.setValue('   ');
    c.form.controls.am.setValue('   ');
    expect(c.form.invalid).toBe(true);
  });

  it('keeps an empty surname neutral when the other surname is valid', () => {
    fixture.detectChanges();
    const c = component();
    c.form.controls.ap.setValue('Paz');
    c.form.controls.ap.markAsTouched();
    fixture.detectChanges();

    const paternalInput = fixture.nativeElement.querySelector('#persona-ap') as HTMLInputElement;
    const maternalInput = fixture.nativeElement.querySelector('#persona-am') as HTMLInputElement;

    expect(paternalInput.classList.contains('field-valid')).toBe(true);
    expect(maternalInput.classList.contains('field-valid')).toBe(false);
    expect(maternalInput.classList.contains('field-error')).toBe(false);
    expect(fixture.nativeElement.querySelector('#persona-surnames-message')).toBeNull();
  });

  it('enforces the maximum length of each surname and shows the group message after submit', () => {
    const c = component();
    setValidForm();
    c.form.controls.ap.setValue('p'.repeat(41));
    c.form.controls.am.setValue('m'.repeat(41));

    expect(c.form.controls.ap.errors?.['maxlength']).toBeTruthy();
    expect(c.form.controls.am.errors?.['maxlength']).toBeTruthy();

    c.form.controls.ap.setValue('');
    c.form.controls.am.setValue('');
    c.submit();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#persona-surnames-message').textContent).toContain(
      'Ingresa al menos un apellido.',
    );
  });

  it('does not emit a save for an invalid submit and preserves entered values', () => {
    const c = component();
    c.form.controls.ci.setValue('123');
    let emitted = false;
    c.saved.subscribe(() => (emitted = true));

    c.submit();

    expect(emitted).toBe(false);
    expect(c.form.controls.ci.errors).toBeNull();
  });

  it('emits a normalized valid create request', () => {
    const c = component();
    setValidForm();
    let paternalSurname: string | null = null;
    c.saved.subscribe((event) => (paternalSurname = event.request.ap));

    c.submit();

    expect(paternalSurname).toBe('Paz');
  });

  it('preloads edit mode and preserves estado in the complete request', () => {
    fixture.componentRef.setInput('persona', {
      codper: 7,
      ci: '123',
      nombre: 'Ana',
      ap: 'Paz',
      am: null,
      genero: 'F',
      estado: 0,
      correo: 'ana@test.com',
      telefono: '70000000',
      tipoPersona: 'A',
      foto: null,
      fechaRegistro: '2026-01-01T00:00:00Z',
      usuario: null,
      acciones: {},
    });
    fixture.detectChanges();
    const c = component();
    let estado: number | undefined;
    c.saved.subscribe((event) => (estado = event.request.estado));

    c.submit();

    expect(fixture.nativeElement.textContent).toContain('Editar Persona');
    expect(fixture.nativeElement.textContent).toContain('Guardar cambios');
    expect(c.form.controls.genero.value).toBe('F');
    expect(c.form.controls.tipoPersona.value).toBe('A');
    expect(estado).toBe(0);
  });

  it('renders backend field errors inline, including the photograph', () => {
    fixture.componentRef.setInput('fieldErrors', {
      nombre: 'Nombre rechazado por el backend.',
      foto: 'Fotografía rechazada por el backend.',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#persona-nombre-message').textContent).toContain(
      'Nombre rechazado por el backend.',
    );
    expect(fixture.nativeElement.textContent).toContain('Fotografía rechazada por el backend.');
  });

  it('blocks controls and presents saving feedback while submitting', () => {
    fixture.componentRef.setInput('submitting', true);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement.querySelector('#persona-ci') as HTMLInputElement).matches(':disabled'),
    ).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Guardando...');
    expect(fixture.nativeElement.querySelector('form').getAttribute('aria-busy')).toBe('true');
  });

  it('closes with Escape when no operation is in progress', () => {
    let closed = false;
    fixture.componentInstance.closed.subscribe(() => (closed = true));
    fixture.detectChanges();
    fixture.nativeElement
      .querySelector('[role="dialog"]')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(closed).toBe(true);
  });
});
