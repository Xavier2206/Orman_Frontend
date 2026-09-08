export interface Rol {
  readonly codr: number;
  readonly nombre: string;
  readonly estado: 0 | 1;
}

export interface RolResumen {
  readonly totalRoles: number;
  readonly activos: number;
  readonly inactivos: number;
}

export interface CreateRolRequest {
  readonly nombre: string;
  readonly estado?: 0 | 1;
}

export interface UpdateRolRequest {
  readonly nombre: string;
}

export interface RolListFilters {
  readonly q: string;
  readonly estado: 0 | 1 | null;
  readonly page: number;
  readonly size: number;
  readonly sort: string;
}
