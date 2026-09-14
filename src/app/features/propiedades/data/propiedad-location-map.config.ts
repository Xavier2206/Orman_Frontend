import type { LatLngExpression } from 'leaflet';

export const PROPERTY_MAP_CONFIG = {
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; OpenStreetMap contributors',
  defaultCenter: [-21.535, -64.729] as LatLngExpression,
  defaultZoom: 12,
  selectedZoom: 16,
  markerIconUrl: '/leaflet/marker-icon.png',
  markerIconRetinaUrl: '/leaflet/marker-icon-2x.png',
  markerShadowUrl: '/leaflet/marker-shadow.png',
} as const;
