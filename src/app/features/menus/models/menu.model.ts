export interface Menu {
  readonly codm: number;
  readonly nombre: string;
  readonly icono: string | null;
  readonly estado: 0 | 1;
}

export interface MenuResumen {
  readonly totalMenus: number;
  readonly activos: number;
  readonly inactivos: number;
}

export interface MenuListParams {
  readonly q: string;
  readonly estado: 0 | 1 | null;
  readonly page: number;
  readonly size: number;
  readonly sort: string;
}

export interface CreateMenuRequest {
  readonly nombre: string;
  readonly icono: string | null;
  readonly estado?: 0 | 1;
}

export interface UpdateMenuRequest {
  readonly nombre: string;
  readonly icono: string | null;
}
