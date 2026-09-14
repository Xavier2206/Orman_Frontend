import { PropiedadEstado, PropiedadTipo } from './propiedad.model';

export interface PropiedadFormValue {
  readonly nombre: string;
  readonly tipo: PropiedadTipo | null;
  readonly direccion: string;
  readonly ciudad: string;
  readonly referencia: string;
  readonly latitud: number | null;
  readonly longitud: number | null;
  readonly inversionInicial: number | null;
}

export interface PropiedadRequest {
  readonly nombre: string;
  readonly tipo: PropiedadTipo;
  readonly direccion: string;
  readonly ciudad: string;
  readonly referencia: string | null;
  readonly latitud: number | null;
  readonly longitud: number | null;
  readonly portadaUrl: string | null;
  readonly codperPropietaria: number;
  readonly inversionInicial: number;
  readonly estado: PropiedadEstado;
}
