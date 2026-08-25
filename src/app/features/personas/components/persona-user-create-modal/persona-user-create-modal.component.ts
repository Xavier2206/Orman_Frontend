import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PersonaUserCreateSubmit } from '../../models/persona-modal.model';
import { PersonaModalFocusDirective } from '../persona-modal-focus.directive';
@Component({
  selector: 'app-persona-user-create-modal',
  imports: [ReactiveFormsModule, PersonaModalFocusDirective],
  templateUrl: './persona-user-create-modal.component.html',
  styleUrl: './persona-user-create-modal.component.css',
})
export class PersonaUserCreateModalComponent {
  readonly personaName = input('');
  readonly submitting = input(false);
  readonly feedback = input<string | null>(null);
  readonly fieldErrors = input<Readonly<Record<string, string>>>({});
  readonly submitted = output<PersonaUserCreateSubmit>();
  readonly closed = output<void>();
  protected readonly form = new FormGroup({
    login: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), Validators.maxLength(72)],
    }),
    confirmation: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  protected mismatch = false;
  protected close(): void {
    if (!this.submitting()) this.closed.emit();
  }
  protected submit(): void {
    this.form.markAllAsTouched();
    const v = this.form.getRawValue();
    this.mismatch = v.password !== v.confirmation;
    if (this.form.invalid || this.mismatch || this.submitting()) return;
    this.submitted.emit({ login: v.login, password: v.password });
  }
}
