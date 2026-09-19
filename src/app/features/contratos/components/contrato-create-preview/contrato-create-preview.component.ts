import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { Persona } from '../../../personas/models/persona.model';
import { Propiedad } from '../../../propiedades/models/propiedad.model';
import { UnidadResponse } from '../../../unidades/models/unidad.model';
import { ContratoArchivoResponse } from '../../models/contrato.model';
import { ContratoPeriodPreview } from '../../utils/contrato-period';

@Component({
  selector: 'app-contrato-create-preview',
  imports: [MatIconModule],
  templateUrl: './contrato-create-preview.component.html',
  styleUrl: './contrato-create-preview.component.css',
})
export class ContratoCreatePreviewComponent {
  readonly tenant = input<Persona | null>(null);
  readonly property = input<Propiedad | null>(null);
  readonly unit = input<UnidadResponse | null>(null);
  readonly period = input<ContratoPeriodPreview | null>(null);
  readonly monthlyRent = input<number | null>(null);
  readonly document = input<ContratoArchivoResponse | null>(null);

  protected fullName(persona: Persona): string {
    return [persona.nombre, persona.ap, persona.am]
      .filter((part): part is string => Boolean(part?.trim()))
      .join(' ');
  }

  protected formatMoney(amount: number | null): string {
    if (amount === null || !Number.isFinite(amount)) {
      return '—';
    }

    return `Bs ${amount.toLocaleString('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  protected formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    const megabytes = bytes / (1024 * 1024);
    if (megabytes >= 1) {
      return `${megabytes.toLocaleString('es-BO', { maximumFractionDigits: 2 })} MB`;
    }

    return `${(bytes / 1024).toLocaleString('es-BO', { maximumFractionDigits: 1 })} KB`;
  }
}
