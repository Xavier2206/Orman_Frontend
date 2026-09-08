import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { RolFormModalComponent } from './rol-form-modal.component';

describe('RolFormModalComponent', () => {
  let fixture: ComponentFixture<RolFormModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolFormModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RolFormModalComponent);
  });

  it('renders the create form with active state by default', () => {
    fixture.componentRef.setInput('mode', 'create');
    fixture.detectChanges();

    const component = fixture.componentInstance as never as {
      form: { controls: { estado: { value: number } } };
    };

    expect(fixture.nativeElement.textContent).toContain('Crear Rol');
    expect(fixture.nativeElement.querySelector('#role-initial-state')).toBeTruthy();
    expect(component.form.controls.estado.value).toBe(1);
  });

  it('validates a required role name', () => {
    fixture.componentRef.setInput('mode', 'create');
    fixture.detectChanges();
    const component = fixture.componentInstance as never as {
      submit(): void;
      form: { controls: { nombre: { setValue(value: string): void } } };
    };

    component.submit();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('El nombre del Rol es obligatorio.');
  });

  it('validates the maximum role name length', () => {
    fixture.componentRef.setInput('mode', 'create');
    fixture.detectChanges();
    const component = fixture.componentInstance as never as {
      submit(): void;
      form: { controls: { nombre: { setValue(value: string): void } } };
    };

    component.form.controls.nombre.setValue('R'.repeat(51));
    component.submit();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'El nombre del Rol admite hasta 50 caracteres.',
    );
  });

  it('emits a trimmed create request with the selected initial state', () => {
    const saved = vi.fn();
    fixture.componentRef.setInput('mode', 'create');
    fixture.componentInstance.saved.subscribe(saved);
    fixture.detectChanges();
    const component = fixture.componentInstance as never as {
      submit(): void;
      form: {
        controls: {
          nombre: { setValue(value: string): void };
          estado: { setValue(value: 0 | 1): void };
        };
      };
    };

    component.form.controls.nombre.setValue(' supervisor ');
    component.form.controls.estado.setValue(0);
    component.submit();

    expect(saved).toHaveBeenCalledWith({ nombre: 'supervisor', estado: 0 });
  });

  it('renders edit mode with the code and without an initial state selector', () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('rol', { codr: 7, nombre: 'SUPERVISOR', estado: 1 });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Editar Rol');
    expect(fixture.nativeElement.textContent).toContain('Código #7');
    expect(fixture.nativeElement.querySelector('#role-initial-state')).toBeNull();
    expect((fixture.nativeElement.querySelector('#role-name') as HTMLInputElement).value).toBe(
      'SUPERVISOR',
    );
  });
});
