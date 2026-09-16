export type ContratoEstado = 'PROGRAMADO' | 'VIGENTE' | 'FINALIZADO' | 'RESCINDIDO';

export interface ContratoInquilino {
  readonly codper: number;
  readonly nombreCompleto: string;
  readonly ci: string;
}

export interface ContratoUnidad {
  readonly coduni: number;
  readonly nombre: string;
  readonly tipoUnidad: string;
  readonly descripcion: string | null;
  readonly piso: number | null;
}

export interface ContratoPropiedad {
  readonly codprop: number;
  readonly nombre: string;
}

export interface ContratoCuotasResumen {
  readonly totalCuotas: number;
  readonly cuotasPagadas: number;
  readonly cuotasPendientes: number;
  readonly saldoPendiente: number;
}

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
  readonly inquilino: ContratoInquilino | null;
  readonly unidad: ContratoUnidad | null;
  readonly propiedad: ContratoPropiedad | null;
  readonly cuotas: ContratoCuotasResumen | null;
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
