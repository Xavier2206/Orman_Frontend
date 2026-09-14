export interface LocationGeocodingConfig {
  readonly reverseUrl: string;
}

export const LOCATION_GEOCODING_CONFIG: LocationGeocodingConfig = {
  reverseUrl: 'https://nominatim.openstreetmap.org/reverse',
};
