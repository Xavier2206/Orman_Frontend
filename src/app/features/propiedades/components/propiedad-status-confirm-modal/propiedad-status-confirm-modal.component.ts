import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { PersonaModalFocusDirective } from '../../../personas/components/persona-modal-focus.directive';

export type PropiedadStatusOperation = 'activate' | 'deactivate';

@Component({
  selector: 'app-propiedad-status-confirm-modal',
  imports: [MatIconModule, PersonaModalFocusDirective],
  templateUrl: './propiedad-status-confirm-modal.component.html',
  styleUrl: './propiedad-status-confirm-modal.component.css',
})
export class PropiedadStatusConfirmModalComponent {
  readonly operation = input.required<PropiedadStatusOperation>();
  readonly propertyName = input.required<string>();
  readonly submitting = input(false);
  readonly feedback = input<string | null>(null);
  readonly confirmed = output<void>();
  readonly closed = output<void>();

  protected operationIcon(): string {
    return this.operation() === 'deactivate' ? 'delete_outline' : 'restore';
  }

  protected operationTitle(): string {
    return this.operation() === 'deactivate' ? 'Desactivar propiedad' : 'Activar propiedad';
  }

  protected operationMessage(): string {
    return this.operation() === 'deactivate'
      ? 'La propiedad pasará a estado inactivo. Sus datos permanecerán registrados y podrá ser activada nuevamente cuando sea necesario.'
      : 'La propiedad volverá a estado activo y podrá continuar siendo gestionada normalmente en el sistema.';
  }

  protected actionLabel(): string {
    return this.operation() === 'deactivate' ? 'Desactivar propiedad' : 'Activar propiedad';
  }

  protected submittingLabel(): string {
    return this.operation() === 'deactivate' ? 'Desactivando...' : 'Activando...';
  }

  protected close(): void {
    if (!this.submitting()) {
      this.closed.emit();
    }
  }
}
