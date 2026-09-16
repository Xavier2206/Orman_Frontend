import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { ContratoResumen } from '../../models/contrato.model';

const EMPTY_CONTRATO_RESUMEN: ContratoResumen = {
  vigentes: 0,
  programados: 0,
  finalizados: 0,
  rescindidos: 0,
};

@Component({
  selector: 'app-contratos-resumen',
  imports: [MatIconModule],
  templateUrl: './contratos-resumen.component.html',
  styleUrl: './contratos-resumen.component.css',
})
export class ContratosResumenComponent {
  readonly resumen = input<ContratoResumen | null>(null);
  readonly loading = input(true);
  readonly error = input<string | null>(null);
  protected readonly displayedResumen = computed(() => this.resumen() ?? EMPTY_CONTRATO_RESUMEN);
}
