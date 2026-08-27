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

import { PersonaFormSubmit } from '../../models/persona-modal.model';
import { Persona, PersonaRequest } from '../../models/persona.model';
import { PersonaPhotoFieldComponent } from '../persona-photo-field/persona-photo-field.component';
import { PersonaModalFocusDirective } from '../persona-modal-focus.directive';

type PersonaFormControlName =
  'ci' | 'nombre' | 'ap' | 'am' | 'genero' | 'correo' | 'telefono' | 'tipoPersona';

type PersonaFormControls = {
  ci: FormControl<string>;
  nombre: FormControl<string>;
  ap: FormControl<string>;
  am: FormControl<string>;
  genero: FormControl<Persona['genero'] | ''>;
  correo: FormControl<string>;
  telefono: FormControl<string>;
  tipoPersona: FormControl<Persona['tipoPersona'] | ''>;
};

const atLeastOneSurnameValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const paternalSurname = String(control.get('ap')?.value ?? '').trim();
  const maternalSurname = String(control.get('am')?.value ?? '').trim();

  return paternalSurname || maternalSurname ? null : { atLeastOneSurname: true };
};

const notBlankValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  String(control.value ?? '').trim() ? null : { required: true };

@Component({
  selector: 'app-persona-form-modal',
  imports: [
    MatIconModule,
    ReactiveFormsModule,
    PersonaPhotoFieldComponent,
    PersonaModalFocusDirective,
  ],
  templateUrl: './persona-form-modal.component.html',
  styleUrl: './persona-form-modal.component.css',
})
export class PersonaFormModalComponent implements OnInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly persona = input<Persona | null>(null);
  readonly photoUrl = input<string | null>(null);
  readonly submitting = input(false);
  readonly feedback = input<string | null>(null);
  readonly fieldErrors = input<Readonly<Record<string, string>>>({});
  readonly closed = output<void>();
  readonly saved = output<PersonaFormSubmit>();
  readonly photoRemoved = output<void>();
  protected selectedPhoto: File | null = null;
  protected readonly photoError = signal<string | null>(null);
  protected readonly submitAttempted = signal(false);
  protected readonly form = new FormGroup<PersonaFormControls>(
    {
      ci: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(20)],
      }),
      nombre: new FormControl('', {
        nonNullable: true,
        validators: [notBlankValidator, Validators.maxLength(60)],
      }),
      ap: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(40)],
      }),
      am: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(40)],
      }),
      genero: new FormControl<Persona['genero'] | ''>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      correo: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email, Validators.maxLength(100)],
      }),
      telefono: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(20)],
      }),
      tipoPersona: new FormControl<Persona['tipoPersona'] | ''>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: [atLeastOneSurnameValidator] },
  );

  ngOnInit(): void {
    const p = this.persona();
    this.form.reset(
      p
        ? {
            ci: p.ci,
            nombre: p.nombre,
            ap: p.ap ?? '',
            am: p.am ?? '',
            genero: p.genero,
            correo: p.correo,
            telefono: p.telefono,
            tipoPersona: p.tipoPersona,
          }
        : {
            ci: '',
            nombre: '',
            ap: '',
            am: '',
            genero: '',
            correo: '',
            telefono: '',
            tipoPersona: '',
          },
    );
  }
  protected initials(): string {
    const p = this.persona();
    return p
      ? [p.nombre, p.ap]
          .filter(Boolean)
          .map((v) => v!.trim().charAt(0))
          .join('')
          .toUpperCase() || 'P'
      : 'P';
  }
  protected selectPhoto(file: File | null): void {
    this.selectedPhoto = file;
    this.photoError.set(null);
  }
  protected setPhotoError(message: string): void {
    this.photoError.set(message);
  }

  protected fieldMessage(field: PersonaFormControlName): string | null {
    const control = this.form.controls[field];

    if (this.shouldShowLocalError(control)) {
      if (control.hasError('required')) {
        return this.requiredMessage(field);
      }

      if (control.hasError('email')) {
        return 'Ingresa un correo válido.';
      }

      if (control.hasError('maxlength')) {
        return this.maxLengthMessage(field);
      }
    }

    return this.fieldErrors()[field] ?? null;
  }

  protected fieldIsValid(field: PersonaFormControlName): boolean {
    const control = this.form.controls[field];

    if (this.fieldErrors()[field] || !control.valid || !(control.dirty || control.touched)) {
      return false;
    }

    if ((field === 'ap' || field === 'am') && !control.value.trim()) {
      return false;
    }

    return true;
  }

  protected surnameMessage(): string | null {
    if (this.form.hasError('atLeastOneSurname') && this.shouldShowSurnameError()) {
      return 'Ingresa al menos un apellido.';
    }

    return null;
  }

  protected surnameIsValid(field: 'ap' | 'am'): boolean {
    const control = this.form.controls[field];

    return Boolean(control.value.trim()) && control.valid && (control.dirty || control.touched);
  }

  protected surnameAriaDescribedBy(field: 'ap' | 'am'): string {
    const messageId = this.fieldMessage(field)
      ? `persona-${field}-message`
      : this.surnameMessage()
        ? 'persona-surnames-message'
        : null;

    return ['persona-surnames-help', messageId].filter(Boolean).join(' ');
  }
  protected removePhoto(): void {
    this.photoRemoved.emit();
  }
  protected close(): void {
    if (!this.submitting()) this.closed.emit();
  }
  protected submit(): void {
    this.submitAttempted.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting()) {
      this.focusFirstInvalidControl();
      return;
    }

    const raw = this.form.getRawValue();
    const current = this.persona();
    const request: PersonaRequest = {
      ...raw,
      ci: raw.ci.trim(),
      nombre: raw.nombre.trim(),
      genero: raw.genero as Persona['genero'],
      ap: raw.ap.trim() || null,
      am: raw.am.trim() || null,
      correo: raw.correo.trim(),
      telefono: raw.telefono.trim(),
      tipoPersona: raw.tipoPersona as Persona['tipoPersona'],
      foto: current?.foto ?? null,
      ...(current ? { estado: current.estado } : {}),
    };
    this.saved.emit({ request, photo: this.selectedPhoto });
  }

  private shouldShowLocalError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.submitAttempted());
  }

  private focusFirstInvalidControl(): void {
    const invalidField = (Object.keys(this.form.controls) as PersonaFormControlName[]).find(
      (field) => this.form.controls[field].invalid,
    );
    const field = invalidField ?? (this.form.hasError('atLeastOneSurname') ? 'ap' : null);

    if (!field) {
      return;
    }

    const fieldId = field === 'tipoPersona' ? 'persona-tipo' : `persona-${field}`;
    queueMicrotask(() =>
      this.host.nativeElement.querySelector<HTMLElement>(`#${fieldId}`)?.focus(),
    );
  }

  private shouldShowSurnameError(): boolean {
    const { ap, am } = this.form.controls;
    return this.submitAttempted() || ap.touched || am.touched;
  }

  private requiredMessage(field: PersonaFormControlName): string {
    const messages: Partial<Record<PersonaFormControlName, string>> = {
      ci: 'El CI es obligatorio.',
      nombre: 'El nombre es obligatorio.',
      genero: 'Selecciona el género.',
      correo: 'El correo es obligatorio.',
      telefono: 'El teléfono es obligatorio.',
      tipoPersona: 'Selecciona el tipo de persona.',
    };

    return messages[field] ?? 'Este campo es obligatorio.';
  }

  private maxLengthMessage(field: PersonaFormControlName): string {
    const messages: Partial<Record<PersonaFormControlName, string>> = {
      ci: 'El CI admite hasta 20 caracteres.',
      nombre: 'El nombre admite hasta 60 caracteres.',
      ap: 'El apellido paterno admite hasta 40 caracteres.',
      am: 'El apellido materno admite hasta 40 caracteres.',
      correo: 'El correo admite hasta 100 caracteres.',
      telefono: 'El teléfono admite hasta 20 caracteres.',
    };

    return messages[field] ?? 'El valor supera la longitud permitida.';
  }
}
