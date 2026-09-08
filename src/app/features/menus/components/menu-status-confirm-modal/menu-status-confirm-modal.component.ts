import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { PersonaModalFocusDirective } from '../../../personas/components/persona-modal-focus.directive';
import { Menu } from '../../models/menu.model';

export type MenuStatusOperation = 'activate' | 'deactivate';

@Component({
  selector: 'app-menu-status-confirm-modal',
  imports: [MatIconModule, PersonaModalFocusDirective],
  templateUrl: './menu-status-confirm-modal.component.html',
  styleUrl: './menu-status-confirm-modal.component.css',
})
export class MenuStatusConfirmModalComponent {
  readonly operation = input.required<MenuStatusOperation>();
  readonly menu = input.required<Menu>();
  readonly submitting = input(false);
  readonly feedback = input<string | null>(null);
  readonly confirmed = output<void>();
  readonly closed = output<void>();

  protected operationIcon(): string {
    return this.operation() === 'deactivate' ? 'delete_outline' : 'restore';
  }

  protected operationTitle(): string {
    return this.operation() === 'deactivate' ? 'Desactivar Menú' : 'Reactivar Menú';
  }

  protected operationMessage(): string {
    return this.operation() === 'deactivate'
      ? 'El Menú pasará a estado inactivo. Sus asignaciones existentes con Roles y Procesos permanecerán registradas, pero dejará de aparecer en el contexto de navegación mientras esté inactivo.'
      : 'El Menú volverá a estado activo y sus asignaciones existentes podrán volver a tener efecto dentro del sistema.';
  }

  protected actionLabel(): string {
    return this.operation() === 'deactivate' ? 'Desactivar Menú' : 'Reactivar Menú';
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
