import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { PersonaModalFocusDirective } from '../../../personas/components/persona-modal-focus.directive';

@Component({
  selector: 'app-unidad-status-confirm-modal',
  imports: [MatIconModule, PersonaModalFocusDirective],
  templateUrl: './unidad-status-confirm-modal.component.html',
  styleUrl: './unidad-status-confirm-modal.component.css',
})
export class UnidadStatusConfirmModalComponent {
  readonly operation = input.required<'activate' | 'deactivate'>();
  readonly unitName = input.required<string>();
  readonly submitting = input(false);
  readonly feedback = input<string | null>(null);
  readonly confirmed = output<void>();
  readonly closed = output<void>();

  protected operationIcon(): string {
    return this.operation() === 'deactivate' ? 'delete_outline' : 'restore';
  }

  protected operationTitle(): string {
    return this.operation() === 'deactivate' ? 'Desactivar unidad' : 'Activar unidad';
  }

  protected operationMessage(): string {
    return this.operation() === 'deactivate'
      ? '¿Deseas desactivar esta unidad? La unidad dejará de estar operativa.'
      : '¿Deseas activar esta unidad? La unidad volverá a estar operativa.';
  }

  protected actionLabel(): string {
    return this.operation() === 'deactivate' ? 'Desactivar unidad' : 'Activar unidad';
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
