import type {
  ContratoInquilino,
  CuotaEstado,
  CuotaResponse,
} from '../../contratos/models/contrato.model';

export type CuotaSituacionVencimiento = 'VENCIDA' | 'HOY' | 'PROXIMA' | 'AL_DIA' | 'SIN_SALDO';

export type CuotaVencimientoFiltro = 'VENCIDAS' | 'HOY' | 'PROXIMAS' | 'AL_DIA';

export interface CuotaListado extends CuotaResponse {
  readonly codperInquilino: number;
  readonly nombreCompleto: string;
  readonly ci: string;
  readonly codprop: number;
  readonly nombrePropiedad: string;
  readonly coduni: number;
  readonly nombreUnidad: string;
  readonly situacionVencimiento: CuotaSituacionVencimiento;
}

export interface CuotaListadoFilters {
  readonly codcuo?: number | null;
  readonly codperInquilino: number | null;
  readonly periodo: string | null;
  readonly estado: CuotaEstado | null;
  readonly vencimiento: CuotaVencimientoFiltro | null;
  readonly codprop: number | null;
  readonly coduni: number | null;
  readonly conPagoPendienteRevision: boolean;
  readonly page: number;
  readonly size: number;
}

export interface CuotaFiltroOpcion {
  readonly value: string;
  readonly label: string;
}

export type InquilinoCuota = ContratoInquilino;
