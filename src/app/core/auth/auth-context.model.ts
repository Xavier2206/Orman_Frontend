export interface AuthContextUsuario {
  readonly login: string;
  readonly codper: number;
}

export interface AuthContextPersona {
  readonly nombre: string;
  readonly ap: string | null;
  readonly am: string | null;
  readonly foto: string | null;
}

export interface AuthContextProceso {
  readonly codp: number;
  readonly nombre: string;
  readonly enlace: string;
}

export interface AuthContextMenu {
  readonly codm: number;
  readonly nombre: string;
  readonly icono: string | null;
  readonly procesos: readonly AuthContextProceso[];
}

export interface AuthContextRol {
  readonly codr: number;
  readonly nombre: string;
  readonly menus: readonly AuthContextMenu[];
}

export interface AuthContext {
  readonly usuario: AuthContextUsuario;
  readonly persona: AuthContextPersona;
  readonly roles: readonly AuthContextRol[];
}
