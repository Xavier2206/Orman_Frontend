export type UnidadEstadoOperativo = 0 | 1;

export interface UnidadRequest {
  readonly nombre: string;
  readonly tipoUnidad: string;
  readonly descripcion: string | null;
  readonly area: number;
  readonly dormitorios: number;
  readonly banos: number;
  readonly piso: number;
  readonly ubicacionInterna: string | null;
  readonly precioBase: number;
  readonly estadoOperativo: UnidadEstadoOperativo;
}

export interface UnidadResponse {
  readonly coduni: number;
  readonly codprop: number;
  readonly nombre: string;
  readonly tipoUnidad: string;
  readonly descripcion: string | null;
  readonly area: number;
  readonly dormitorios: number;
  readonly banos: number;
  readonly piso: number;
  readonly ubicacionInterna: string | null;
  readonly precioBase: number;
  readonly estadoOperativo: UnidadEstadoOperativo;
  readonly disponibleParaContrato: boolean;
}
