import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { PropiedadResumen } from '../../models/propiedad-resumen.model';
import {
  formatPropiedadInvestment,
  formatPropiedadOccupancy,
} from '../../utils/propiedad-formatters';

@Component({
  selector: 'app-propiedades-resumen',
  imports: [MatIconModule],
  templateUrl: './propiedades-resumen.component.html',
  styleUrl: './propiedades-resumen.component.css',
})
export class PropiedadesResumenComponent {
  readonly resumen = input<PropiedadResumen | null>(null);
  readonly loading = input(true);
  readonly error = input<string | null>(null);

  protected formatInvestment(value: number): string {
    return formatPropiedadInvestment(value);
  }

  protected propertyCountLabel(count: number): string {
    return `${count} ${count === 1 ? 'Inmueble' : 'Inmuebles'}`;
  }

  protected buildingCountLabel(count: number): string {
    return `${count} ${count === 1 ? 'Edificio' : 'Edificios'}`;
  }

  protected houseCountLabel(count: number): string {
    return `${count} ${count === 1 ? 'Casa' : 'Casas'}`;
  }

  protected unitCountLabel(count: number): string {
    return `${count} ${count === 1 ? 'Unidad' : 'Unidades'}`;
  }

  protected enabledUnitCountLabel(count: number): string {
    return `${count} ${count === 1 ? 'Habilitada' : 'Habilitadas'}`;
  }

  protected disabledUnitCountLabel(count: number): string {
    return `${count} ${count === 1 ? 'No habilitada' : 'No habilitadas'}`;
  }

  protected occupancyLabel(summary: PropiedadResumen): string {
    const enabledUnitNoun =
      summary.unidadesHabilitadas === 1 ? 'unidad habilitada' : 'unidades habilitadas';
    const occupiedUnitNoun = summary.unidadesOcupadas === 1 ? 'ocupada' : 'ocupadas';

    return `${summary.unidadesOcupadas} de ${summary.unidadesHabilitadas} ${enabledUnitNoun} ${occupiedUnitNoun}`;
  }

  protected formatOccupancy(value: number): string {
    return formatPropiedadOccupancy(value);
  }
}
