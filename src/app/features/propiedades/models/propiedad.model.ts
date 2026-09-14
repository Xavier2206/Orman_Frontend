export type PropiedadTipo = 'CASA' | 'EDIFICIO';
export type PropiedadEstado = 0 | 1;

export interface Propiedad {
  readonly codprop: number;
  readonly nombre: string;
  readonly tipo: PropiedadTipo;
  readonly direccion: string;
  readonly ciudad: string;
  readonly referencia: string | null;
  readonly latitud: number | null;
  readonly longitud: number | null;
  readonly portadaUrl: string | null;
  readonly tienePortada: boolean;
  readonly codperPropietaria: number;
  readonly inversionInicial: number;
  readonly estado: PropiedadEstado;
  readonly cantidadUnidades: number;
  readonly unidadesHabilitadas: number;
  readonly unidadesOcupadas: number;
  readonly ocupacion: number;
}

export interface PropiedadListFilters {
  readonly q: string;
  readonly tipo: PropiedadTipo | null;
  readonly estado: PropiedadEstado | null;
  readonly page: number;
  readonly size: number;
  readonly sort: string;
}
