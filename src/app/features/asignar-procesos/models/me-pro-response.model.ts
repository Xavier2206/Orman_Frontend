export interface MeProResponse {
  readonly codm: number;
  readonly nombreMenu: string;
  readonly estadoMenu: 0 | 1;
  readonly codp: number;
  readonly nombreProceso: string;
  readonly enlaceProceso: string;
  readonly estadoProceso: 0 | 1;
}
