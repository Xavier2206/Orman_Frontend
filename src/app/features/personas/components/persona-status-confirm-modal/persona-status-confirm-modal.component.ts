import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { PersonaModalFocusDirective } from '../persona-modal-focus.directive';

@Component({
  selector: 'app-persona-status-confirm-modal',
  imports: [MatIconModule, PersonaModalFocusDirective],
  templateUrl: './persona-status-confirm-modal.component.html',
  styleUrl: './persona-status-confirm-modal.component.css',
})
export class PersonaStatusConfirmModalComponent {
  readonly operation = input.required<'activate' | 'deactivate'>();
  readonly personaName = input.required<string>();
  readonly submitting = input(false);
  readonly feedback = input<string | null>(null);
  readonly confirmed = output<void>();
  readonly closed = output<void>();

  protected operationIcon(): string {
    return this.operation() === 'deactivate' ? 'person_off' : 'restore';
  }

  protected operationTitle(): string {
    return this.operation() === 'deactivate' ? 'Dar de baja Persona' : 'Reactivar Persona';
  }

  protected operationMessage(): string {
    return this.operation() === 'deactivate'
      ? 'La persona pasará a estado inactivo. Sus datos permanecerán registrados en el sistema y podrá ser reactivada cuando sea necesario.'
      : 'La persona volverá a estado activo y podrá continuar siendo gestionada normalmente en el sistema.';
  }

  protected actionLabel(): string {
    return this.operation() === 'deactivate' ? 'Dar de baja' : 'Reactivar persona';
  }

  protected submittingLabel(): string {
    return this.operation() === 'deactivate' ? 'Desactivando...' : 'Reactivando...';
  }

  protected close(): void {
    if (!this.submitting()) {
      this.closed.emit();
    }
  }
}
