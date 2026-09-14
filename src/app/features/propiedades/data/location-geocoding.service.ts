import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, defer, map, switchMap, timer } from 'rxjs';

import { SKIP_AUTH_INTERCEPTOR } from '../../../core/auth/auth-http-context';
import { LocationGeocodingResult, PropiedadCoordinates } from '../models/propiedad-location.model';
import { LOCATION_GEOCODING_CONFIG } from './location-geocoding.config';

const MINIMUM_REQUEST_INTERVAL_MS = 1_000;

@Injectable({ providedIn: 'root' })
export class LocationGeocodingService {
  private readonly http = inject(HttpClient);
  private nextRequestAt = 0;

  reverse(coordinates: PropiedadCoordinates): Observable<LocationGeocodingResult | null> {
    const params = new HttpParams()
      .set('lat', coordinates.latitud)
      .set('lon', coordinates.longitud)
      .set('format', 'jsonv2')
      .set('addressdetails', '1')
      .set('zoom', '18')
      .set('accept-language', 'es');

    return this.scheduleRequest(() =>
      this.http
        .get<unknown>(LOCATION_GEOCODING_CONFIG.reverseUrl, {
          context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true),
          params,
        })
        .pipe(map((response) => this.toResult(response))),
    );
  }

  private scheduleRequest<T>(requestFactory: () => Observable<T>): Observable<T> {
    return defer(() => {
      const now = Date.now();
      const delay = Math.max(0, this.nextRequestAt - now);
      this.nextRequestAt = now + delay + MINIMUM_REQUEST_INTERVAL_MS;

      return timer(delay).pipe(switchMap(requestFactory));
    });
  }

  private toResult(response: unknown): LocationGeocodingResult | null {
    if (!this.isRecord(response)) {
      return null;
    }

    const latitud = this.toCoordinate(response['lat']);
    const longitud = this.toCoordinate(response['lon']);

    if (latitud === null || longitud === null) {
      return null;
    }

    const address = this.isRecord(response['address']) ? response['address'] : null;
    const displayName = this.toText(response['display_name']) ?? `${latitud}, ${longitud}`;

    return {
      latitud,
      longitud,
      displayName,
      direccion: this.addressText(address, displayName),
      ciudad: this.cityText(address),
    };
  }

  private addressText(address: Record<string, unknown> | null, fallback: string): string {
    if (!address) {
      return fallback;
    }

    const street =
      this.toText(address['road']) ??
      this.toText(address['pedestrian']) ??
      this.toText(address['footway']);
    const houseNumber = this.toText(address['house_number']);

    if (street && houseNumber) {
      return `${street} ${houseNumber}`;
    }

    return street ?? fallback;
  }

  private cityText(address: Record<string, unknown> | null): string | null {
    if (!address) {
      return null;
    }

    return (
      this.toText(address['city']) ??
      this.toText(address['town']) ??
      this.toText(address['village']) ??
      this.toText(address['municipality']) ??
      this.toText(address['county'])
    );
  }

  private toCoordinate(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsedValue = Number(value);

      return Number.isFinite(parsedValue) ? parsedValue : null;
    }

    return null;
  }

  private toText(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const text = value.trim();

    return text || null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
