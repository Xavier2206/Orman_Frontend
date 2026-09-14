import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SKIP_AUTH_INTERCEPTOR } from '../../../core/auth/auth-http-context';
import { LocationGeocodingResult } from '../models/propiedad-location.model';
import { LOCATION_GEOCODING_CONFIG } from './location-geocoding.config';
import { LocationGeocodingService } from './location-geocoding.service';

describe('LocationGeocodingService', () => {
  let service: LocationGeocodingService;
  let http: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [LocationGeocodingService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LocationGeocodingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  it('maps reverse geocoding and returns null for an invalid response', () => {
    let result: LocationGeocodingResult | null | undefined;
    service.reverse({ latitud: -21.535, longitud: -64.729 }).subscribe((response) => {
      result = response;
    });
    vi.runOnlyPendingTimers();

    const request = http.expectOne(
      (httpRequest) => httpRequest.url === LOCATION_GEOCODING_CONFIG.reverseUrl,
    );
    expect(request.request.params.get('lat')).toBe('-21.535');
    expect(request.request.params.get('lon')).toBe('-64.729');
    request.flush({
      lat: '-21.535',
      lon: '-64.729',
      display_name: 'Tarija, Bolivia',
      address: { town: 'Tarija' },
    });
    expect(result).toEqual({
      latitud: -21.535,
      longitud: -64.729,
      displayName: 'Tarija, Bolivia',
      direccion: 'Tarija, Bolivia',
      ciudad: 'Tarija',
    });

    let invalidResult: LocationGeocodingResult | null | undefined;
    service.reverse({ latitud: -21.535, longitud: -64.729 }).subscribe((response) => {
      invalidResult = response;
    });
    vi.advanceTimersByTime(1_000);
    const invalidRequest = http.expectOne(
      (httpRequest) => httpRequest.url === LOCATION_GEOCODING_CONFIG.reverseUrl,
    );
    invalidRequest.flush({ invalid: true });
    expect(invalidResult).toBeNull();
  });

  it('spaces reverse requests by at least one second', () => {
    service.reverse({ latitud: -21.5, longitud: -64.7 }).subscribe();
    vi.runOnlyPendingTimers();
    const firstRequest = http.expectOne(
      (httpRequest) => httpRequest.url === LOCATION_GEOCODING_CONFIG.reverseUrl,
    );
    firstRequest.flush([]);

    service.reverse({ latitud: -21.5, longitud: -64.7 }).subscribe();
    vi.advanceTimersByTime(999);
    http.expectNone(LOCATION_GEOCODING_CONFIG.reverseUrl);
    vi.advanceTimersByTime(1);
    http
      .expectOne((httpRequest) => httpRequest.url === LOCATION_GEOCODING_CONFIG.reverseUrl)
      .flush({});
  });
});
