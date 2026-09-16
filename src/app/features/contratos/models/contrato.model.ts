export type ContratoEstado = 'PROGRAMADO' | 'VIGENTE' | 'FINALIZADO' | 'RESCINDIDO';

export interface Contrato {
  readonly codcon: number;
  readonly coduni: number;
  readonly codperInquilino: number;
  readonly fechaInicio: string;
  readonly fechaFin: string;
  readonly montoMensual: number;
  readonly moneda: string;
  readonly garantia: number;
  readonly estado: ContratoEstado;
  readonly fechaRegistro: string;
  readonly fechaRescision: string | null;
  readonly motivoRescision: string | null;
  readonly inquilinoNombre?: string | null;
  readonly inquilinoCi?: string | null;
  readonly inquilinoAp?: string | null;
  readonly inquilinoAm?: string | null;
  readonly propiedadNombre?: string | null;
  readonly unidadNombre?: string | null;
  readonly cuotasPagadas?: number | null;
  readonly cuotasTotales?: number | null;
  readonly totalCuotas?: number | null;
  readonly saldoPendiente?: number | null;
}

export interface ContratoListFilters {
  readonly q: string;
  readonly codprop: number | null;
  readonly coduni: number | null;
  readonly estado: ContratoEstado | null;
  readonly page: number;
  readonly size: number;
  readonly sort: string;
}

export interface ContratoResumen {
  readonly vigentes: number;
  readonly programados: number;
  readonly finalizados: number;
  readonly rescindidos: number;
}
