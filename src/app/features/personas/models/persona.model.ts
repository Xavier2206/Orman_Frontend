export interface PersonaUsuario {
  readonly login: string;
  readonly estado: number;
}

export interface PersonaAcciones {
  readonly puedeEditar: boolean;
  readonly puedeDesactivar: boolean;
  readonly puedeActivar: boolean;
  readonly puedeEliminar: boolean;
  readonly puedeCrearUsuario: boolean;
  readonly puedeCambiarPassword: boolean;
}

export interface Persona {
  readonly codper: number;
  readonly ci: string;
  readonly nombre: string;
  readonly ap: string | null;
  readonly am: string | null;
  readonly genero: 'M' | 'F';
  readonly estado: 0 | 1;
  readonly correo: string;
  readonly telefono: string;
  readonly tipoPersona: 'A' | 'I';
  readonly foto: string | null;
  readonly fechaRegistro: string;
  readonly usuario: PersonaUsuario | null;
  readonly acciones: PersonaAcciones;
}

export interface PageResponse<T> {
  readonly content: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
  readonly first: boolean;
  readonly last: boolean;
}

export interface PersonaRequest {
  readonly ci: string;
  readonly nombre: string;
  readonly ap: string | null;
  readonly am: string | null;
  readonly genero: 'M' | 'F';
  readonly estado?: 0 | 1;
  readonly correo: string;
  readonly telefono: string;
  readonly tipoPersona: 'A' | 'I';
  readonly foto: string | null;
}

export interface CrearUsuarioRequest {
  readonly login: string;
  readonly password: string;
  readonly codper: number;
}

export interface CambiarPasswordRequest {
  readonly newPassword: string;
}

export interface PersonaListFilters {
  readonly q: string;
  readonly tipoPersona: 'A' | 'I' | null;
  readonly estado: 0 | 1 | null;
  readonly page: number;
  readonly size: number;
  readonly sort: string;
}
