export interface PropiedadCoordinates {
  readonly latitud: number;
  readonly longitud: number;
}

export interface LocationGeocodingResult extends PropiedadCoordinates {
  readonly displayName: string;
  readonly direccion: string | null;
  readonly ciudad: string | null;
}
