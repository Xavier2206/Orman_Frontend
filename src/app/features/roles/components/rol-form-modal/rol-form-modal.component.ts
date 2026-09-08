import { Component, ElementRef, OnInit, inject, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { CreateRolRequest, Rol } from '../../models/rol.model';
import { PersonaModalFocusDirective } from '../../../personas/components/persona-modal-focus.directive';

export type RolFormMode = 'create' | 'edit';

type RolFormControls = {
  nombre: FormControl<string>;
  estado: FormControl<0 | 1>;
};

const notBlankValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  String(control.value ?? '').trim() ? null : { required: true };

@Component({
  selector: 'app-rol-form-modal',
  imports: [MatIconModule, ReactiveFormsModule, PersonaModalFocusDirective],
  templateUrl: './rol-form-modal.component.html',
  styleUrl: './rol-form-modal.component.css',
})
export class RolFormModalComponent implements OnInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly mode = input.required<RolFormMode>();
  readonly rol = input<Rol | null>(null);
  readonly submitting = input(false);
  readonly feedback = input<string | null>(null);
  readonly fieldErrors = input<Readonly<Record<string, string>>>({});
  readonly closed = output<void>();
  readonly saved = output<CreateRolRequest>();
  protected readonly submitAttempted = signal(false);
  protected readonly form = new FormGroup<RolFormControls>({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [notBlankValidator, Validators.maxLength(50)],
    }),
    estado: new FormControl<0 | 1>(1, { nonNullable: true }),
  });

  ngOnInit(): void {
    const rol = this.rol();

    this.form.reset({
      nombre: rol?.nombre ?? '',
      estado: 1,
    });
  }

  protected isCreate(): boolean {
    return this.mode() === 'create';
  }

  protected fieldMessage(): string | null {
    const control = this.form.controls.nombre;

    if (control.invalid && (control.touched || this.submitAttempted())) {
      if (control.hasError('required')) {
        return 'El nombre del Rol es obligatorio.';
      }

      if (control.hasError('maxlength')) {
        return 'El nombre del Rol admite hasta 50 caracteres.';
      }
    }

    return this.fieldErrors()['nombre'] ?? null;
  }

  protected close(): void {
    if (!this.submitting()) {
      this.closed.emit();
    }
  }

  protected submit(): void {
    this.submitAttempted.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting()) {
      this.focusNameInput();
      return;
    }

    const raw = this.form.getRawValue();
    const request: CreateRolRequest = {
      nombre: raw.nombre.trim(),
      ...(this.isCreate() ? { estado: raw.estado } : {}),
    };

    this.saved.emit(request);
  }

  private focusNameInput(): void {
    queueMicrotask(() => this.host.nativeElement.querySelector<HTMLElement>('#role-name')?.focus());
  }
}
