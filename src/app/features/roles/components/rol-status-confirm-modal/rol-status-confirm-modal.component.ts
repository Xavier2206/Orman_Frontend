import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { PersonaModalFocusDirective } from '../../../personas/components/persona-modal-focus.directive';

export type RolStatusOperation = 'activate' | 'deactivate';

@Component({
  selector: 'app-rol-status-confirm-modal',
  imports: [MatIconModule, PersonaModalFocusDirective],
  templateUrl: './rol-status-confirm-modal.component.html',
  styleUrl: './rol-status-confirm-modal.component.css',
})
export class RolStatusConfirmModalComponent {
  readonly operation = input.required<RolStatusOperation>();
  readonly roleName = input.required<string>();
  readonly submitting = input(false);
  readonly feedback = input<string | null>(null);
  readonly confirmed = output<void>();
  readonly closed = output<void>();

  protected operationIcon(): string {
    return this.operation() === 'deactivate' ? 'delete_outline' : 'restore';
  }

  protected operationTitle(): string {
    return this.operation() === 'deactivate' ? 'Desactivar Rol' : 'Reactivar Rol';
  }

  protected operationMessage(): string {
    return this.operation() === 'deactivate'
      ? 'El Rol pasará a estado inactivo. Las asignaciones existentes permanecerán registradas, pero dejará de otorgar autorización mientras esté inactivo.'
      : 'El Rol volverá a estado activo y sus asignaciones existentes podrán volver a tener efecto dentro del sistema.';
  }

  protected actionLabel(): string {
    return this.operation() === 'deactivate' ? 'Desactivar Rol' : 'Reactivar Rol';
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
