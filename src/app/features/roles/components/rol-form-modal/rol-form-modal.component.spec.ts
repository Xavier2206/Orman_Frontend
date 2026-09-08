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
    expect(fixture.nativeElement.querySelector('#role-initial-state-label')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[role="radiogroup"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.state-selected')?.textContent).toContain('Activo');
    expect(fixture.nativeElement.querySelector('.preview-card')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.preview-card')?.textContent).toContain(
      'Nuevo Rol',
    );
    expect(component.form.controls.estado.value).toBe(1);
  });

  it('updates the visual initial state and preview without changing the request contract', () => {
    fixture.componentRef.setInput('mode', 'create');
    fixture.detectChanges();
    const component = fixture.componentInstance as never as {
      form: { controls: { estado: { value: number } } };
    };

    (
      fixture.nativeElement.querySelectorAll('.state-options button')[1] as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(component.form.controls.estado.value).toBe(0);
    const stateButtons = fixture.nativeElement.querySelectorAll('.state-options button');
    expect(stateButtons[0].classList.contains('state-selected')).toBe(false);
    expect(stateButtons[1].classList.contains('state-selected')).toBe(true);
    expect(fixture.nativeElement.querySelector('.preview-status')?.textContent).toContain(
      'Inactivo',
    );
    expect(
      (fixture.nativeElement.querySelector('.preview-status') as HTMLElement).classList.contains(
        'preview-status-inactive',
      ),
    ).toBe(true);
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

  it('renders edit mode with the code and current status without an initial state selector', () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('rol', { codr: 7, nombre: 'SUPERVISOR', estado: 0 });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Editar Rol');
    expect(fixture.nativeElement.textContent).toContain('Código #7');
    expect(fixture.nativeElement.querySelector('#role-initial-state-label')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="radiogroup"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.preview-card')?.textContent).toContain(
      'SUPERVISOR',
    );
    expect(fixture.nativeElement.querySelector('.preview-status')?.textContent).toContain(
      'Inactivo',
    );
    expect(
      (fixture.nativeElement.querySelector('.preview-status') as HTMLElement).classList.contains(
        'preview-status-inactive',
      ),
    ).toBe(true);
    expect((fixture.nativeElement.querySelector('#role-name') as HTMLInputElement).value).toBe(
      'SUPERVISOR',
    );
  });
});
