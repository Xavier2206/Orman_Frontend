export interface NotificacionResponse {
  readonly codnot: number;
  readonly tipo: string;
  readonly titulo: string;
  readonly mensaje: string;
  readonly referenciaTipo: string;
  readonly referenciaId: number;
  readonly fechaCreacion: string;
  readonly leida: boolean;
  readonly fechaLectura: string | null;
}

export interface NotificacionResumenResponse {
  readonly noLeidas: number;
}

export interface NotificacionesPageResponse {
  readonly content: readonly NotificacionResponse[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
  readonly first: boolean;
  readonly last: boolean;
}
