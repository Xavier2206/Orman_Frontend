import { Component, OnInit, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { PersonaFormSubmit } from '../../models/persona-modal.model';
import { Persona, PersonaRequest } from '../../models/persona.model';
import { PersonaPhotoFieldComponent } from '../persona-photo-field/persona-photo-field.component';
import { PersonaModalFocusDirective } from '../persona-modal-focus.directive';

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
  protected readonly form = new FormGroup({
    ci: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(20)],
    }),
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    ap: new FormControl('', { nonNullable: true }),
    am: new FormControl('', { nonNullable: true }),
    genero: new FormControl<'M' | 'F'>('F', {
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
    tipoPersona: new FormControl<'A' | 'I'>('A', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

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
            genero: 'F',
            correo: '',
            telefono: '',
            tipoPersona: 'A',
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
  protected removePhoto(): void {
    this.photoRemoved.emit();
  }
  protected close(): void {
    if (!this.submitting()) this.closed.emit();
  }
  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;
    const raw = this.form.getRawValue();
    const current = this.persona();
    const request: PersonaRequest = {
      ...raw,
      ap: raw.ap.trim() || null,
      am: raw.am.trim() || null,
      foto: current?.foto ?? null,
      ...(current ? { estado: current.estado } : {}),
    };
    this.saved.emit({ request, photo: this.selectedPhoto });
  }
}
