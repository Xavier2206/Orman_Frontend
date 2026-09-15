import { Component, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { formatPropiedadInvestment } from '../../../propiedades/utils/propiedad-formatters';
import { UnidadResponse } from '../../models/unidad.model';

@Component({
  selector: 'app-unidad-card',
  imports: [MatIconModule],
  templateUrl: './unidad-card.component.html',
  styleUrl: './unidad-card.component.css',
})
export class UnidadCardComponent {
  readonly unidad = input.required<UnidadResponse>();
  readonly statusSubmitting = input(false);
  readonly editRequested = output<void>();
  readonly detailRequested = output<void>();
  readonly statusChangeRequested = output<'activate' | 'deactivate'>();
  protected readonly mobileMenuOpen = signal(false);

  protected statusLabel(estadoOperativo: number): string {
    return estadoOperativo === 1 ? 'OPERATIVA' : 'NO OPERATIVA';
  }

  protected formatArea(area: number): string {
    return `${new Intl.NumberFormat('es-BO', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(area)} m²`;
  }

  protected formatPrice(precioBase: number): string {
    return formatPropiedadInvestment(precioBase);
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  protected requestEdit(): void {
    this.mobileMenuOpen.set(false);
    this.editRequested.emit();
  }

  protected requestDetail(): void {
    this.mobileMenuOpen.set(false);
    this.detailRequested.emit();
  }

  protected requestStatusChange(): void {
    this.mobileMenuOpen.set(false);
    this.statusChangeRequested.emit(
      this.unidad().estadoOperativo === 1 ? 'deactivate' : 'activate',
    );
  }
}
