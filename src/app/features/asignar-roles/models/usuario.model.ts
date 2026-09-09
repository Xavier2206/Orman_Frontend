export interface Usuario {
  readonly login: string;
  readonly estado: 0 | 1;
  readonly codper: number;
  readonly nombre: string;
  readonly ap: string | null;
  readonly am: string | null;
}
