export type ContratoEstado = 'PROGRAMADO' | 'VIGENTE' | 'FINALIZADO' | 'RESCINDIDO';

export interface ContratoResumen {
  readonly vigentes: number;
  readonly programados: number;
  readonly finalizados: number;
  readonly rescindidos: number;
}

export interface ContratoCreateRequest {
  readonly codperInquilino: number;
  readonly fechaInicio: string;
  readonly fechaFin: string;
  readonly montoMensual: number;
  readonly garantia: number;
}

export interface ContratoRescindRequest {
  readonly fechaRescision: string;
  readonly motivoRescision: string;
}

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

export type CuotaEstado = 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'ANULADA';

export interface CuotaResponse {
  readonly codcuo: number;
  readonly codcon: number;
  readonly periodo: string;
  readonly fechaVencimiento: string;
  readonly monto: number;
  readonly montoConfirmado: number;
  readonly saldo: number;
  readonly montoPendienteRevision: number;
  readonly estado: CuotaEstado;
}

export type PagoEstado = 'PENDIENTE_REVISION' | 'CONFIRMADO' | 'RECHAZADO' | 'ANULADO';

export type PagoOrigenRegistro = 'PROPIETARIA' | 'INQUILINO';

export interface PagoResponse {
  readonly codpag: number;
  readonly codcuo: number;
  readonly codqr: number | null;
  readonly monto: number;
  readonly metodo: MetodoPago;
  readonly fechaPago: string;
  readonly fechaRegistro: string;
  readonly estado: PagoEstado;
  readonly origenRegistro: PagoOrigenRegistro;
  readonly registradoPor: string;
  readonly revisadoPor: string | null;
  readonly fechaRevision: string | null;
  readonly motivoRechazo: string | null;
  readonly motivoAnulacion: string | null;
}

export type MetodoPago = 'EFECTIVO' | 'QR';

export interface PagoCreateRequest {
  readonly monto: number;
  readonly metodo: MetodoPago;
  readonly idempotencyKey: string;
  readonly fechaPago?: string;
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

export interface ContratoArchivoResponse {
  readonly codarc: number;
  readonly codcon: number;
  readonly nombreArchivo: string;
  readonly tipoContenido: string;
  readonly tamanoOriginal: number;
  readonly tamanoFinal: number;
  readonly fechaSubida: string;
  readonly subidoPor: string;
  readonly orden: number;
  readonly almacenadoInternamente: boolean;
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
