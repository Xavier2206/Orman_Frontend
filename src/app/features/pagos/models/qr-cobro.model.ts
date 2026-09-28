export type QrCobroEstado = 'ACTIVO' | 'INACTIVO';

export interface QrCobroResponse {
  readonly codqr: number;
  readonly fechaInicio: string;
  readonly fechaFin: string;
  readonly estado: QrCobroEstado;
  readonly tieneImagen: boolean;
  readonly nombreArchivo: string;
  readonly tipoContenido: string;
  readonly fechaRegistro: string;
}

export interface QrCobroCreateRequest {
  readonly fechaInicio: string;
  readonly fechaFin: string;
}
