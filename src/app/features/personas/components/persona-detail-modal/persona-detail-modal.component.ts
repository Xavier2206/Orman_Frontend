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
  readonly imageUrl = input<string | null>(null);
  readonly closed = output<void>();
  protected readonly generatedAt = new Date();

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

  protected genderName(): string {
    return this.persona().genero === 'M' ? 'Masculino' : 'Femenino';
  }

  protected typeName(): string {
    return this.persona().tipoPersona === 'A' ? 'Administrativo' : 'Inquilino';
  }

  protected statusName(): string {
    return this.persona().estado === 1 ? 'Activa' : 'Inactiva';
  }

  protected statusIcon(): string {
    return this.persona().estado === 1 ? 'check_circle' : 'cancel';
  }

  protected userName(): string {
    return this.persona().usuario?.login ?? 'Sin usuario vinculado';
  }

  protected print(): void {
    window.print();
  }
}
