import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Persona } from '../../models/persona.model';
import { PersonaModalFocusDirective } from '../persona-modal-focus.directive';
@Component({
  selector: 'app-persona-detail-modal',
  imports: [DatePipe, MatIconModule, PersonaModalFocusDirective],
  templateUrl: './persona-detail-modal.component.html',
  styleUrl: './persona-detail-modal.component.css',
})
export class PersonaDetailModalComponent {
  readonly persona = input.required<Persona>();
  readonly closed = output<void>();
  protected name(): string {
    const p = this.persona();
    return [p.nombre, p.ap, p.am].filter(Boolean).join(' ');
  }
  protected initials(): string {
    return (
      this.name()
        .split(' ')
        .map((part) => part.charAt(0))
        .join('')
        .toUpperCase() || 'P'
    );
  }
  protected print(): void {
    window.print();
  }
}
