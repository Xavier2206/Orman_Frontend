import { Component, input, output } from '@angular/core';
import { PersonaModalFocusDirective } from '../persona-modal-focus.directive';
@Component({
  selector: 'app-persona-status-confirm-modal',
  imports: [PersonaModalFocusDirective],
  templateUrl: './persona-status-confirm-modal.component.html',
  styleUrl: './persona-status-confirm-modal.component.css',
})
export class PersonaStatusConfirmModalComponent {
  readonly operation = input.required<'activate' | 'deactivate'>();
  readonly submitting = input(false);
  readonly confirmed = output<void>();
  readonly closed = output<void>();
  protected close(): void {
    if (!this.submitting()) this.closed.emit();
  }
}
