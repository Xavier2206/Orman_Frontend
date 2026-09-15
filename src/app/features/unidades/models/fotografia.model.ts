export interface UnidadFotoResponse {
  readonly id: number;
  readonly coduni: number;
  readonly url: string | null;
  readonly titulo: string | null;
  readonly ambiente: string | null;
  readonly orden: number;
  readonly portada: boolean;
  readonly tieneArchivo: boolean;
}

export interface UnidadFotoMetadataRequest {
  readonly titulo: string | null;
  readonly ambiente: string | null;
  readonly orden: number;
}

export type UnidadFotoImageStatus = 'loading' | 'ready' | 'error' | 'unavailable';

export interface UnidadFotoView {
  readonly key: string;
  readonly id: number | null;
  readonly titulo: string | null;
  readonly ambiente: string | null;
  readonly orden: number;
  readonly portada: boolean;
  readonly imageUrl: string | null;
  readonly imageStatus: UnidadFotoImageStatus;
  readonly pending: boolean;
  readonly fileName: string | null;
}
