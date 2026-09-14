import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { PropiedadApiService } from './propiedad-api.service';
import { PropiedadRequest } from '../models/propiedad-form.model';

describe('PropiedadApiService', () => {
  let service: PropiedadApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PropiedadApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PropiedadApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const request: PropiedadRequest = {
    nombre: 'Casa Central',
    tipo: 'CASA',
    direccion: 'Calle Sucre 123',
    ciudad: 'Tarija',
    referencia: null,
    latitud: -21.535,
    longitud: -64.729,
    portadaUrl: null,
    codperPropietaria: 3,
    inversionInicial: 350000,
    estado: 1,
  };

  it('loads the paginated property list with the confirmed API contract', () => {
    service
      .list({ q: 'sur', tipo: 'EDIFICIO', estado: 1, page: 0, size: 20, sort: 'nombre,asc' })
      .subscribe((response) => {
        expect(response.totalElements).toBe(1);
        expect(response.content[0]?.cantidadUnidades).toBe(3);
        expect(response.content[0]?.unidadesHabilitadas).toBe(8);
        expect(response.content[0]?.unidadesOcupadas).toBe(7);
        expect(response.content[0]?.ocupacion).toBe(87.5);
      });

    const request = http.expectOne((request) => request.url === '/api/v1/propiedades');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('q')).toBe('sur');
    expect(request.request.params.get('tipo')).toBe('EDIFICIO');
    expect(request.request.params.get('estado')).toBe('1');
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.get('size')).toBe('20');
    expect(request.request.params.get('sort')).toBe('nombre,asc');

    request.flush({
      content: [
        {
          codprop: 7,
          nombre: 'Edificio Sur',
          tipo: 'EDIFICIO',
          direccion: 'Calle Sur 123',
          ciudad: 'Tarija',
          referencia: null,
          latitud: null,
          longitud: null,
          portadaUrl: null,
          tienePortada: false,
          codperPropietaria: 3,
          inversionInicial: 3500000,
          estado: 1,
          cantidadUnidades: 3,
          unidadesHabilitadas: 8,
          unidadesOcupadas: 7,
          ocupacion: 87.5,
        },
      ],
      page: 0,
      size: 12,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    });
  });

  it('omits an empty search parameter', () => {
    service
      .list({ q: '  ', tipo: null, estado: null, page: 0, size: 20, sort: 'nombre,asc' })
      .subscribe();

    const request = http.expectOne((request) => request.url === '/api/v1/propiedades');

    expect(request.request.params.get('q')).toBeNull();
    expect(request.request.params.get('tipo')).toBeNull();
    expect(request.request.params.get('estado')).toBeNull();
    request.flush({
      content: [],
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    });
  });

  it('sends only the confirmed numeric inactive status and property type values', () => {
    service
      .list({ q: '', tipo: 'CASA', estado: 0, page: 0, size: 20, sort: 'nombre,asc' })
      .subscribe();

    const request = http.expectOne((request) => request.url === '/api/v1/propiedades');

    expect(request.request.params.get('tipo')).toBe('CASA');
    expect(request.request.params.get('estado')).toBe('0');
    request.flush({
      content: [],
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    });
  });

  it('loads the global property summary without owner parameters', () => {
    service.getResumen().subscribe((summary) => {
      expect(summary.inversionTotal).toBe(3500);
      expect(summary.propiedadesActivas).toBe(2);
      expect(summary.unidadesOcupadas).toBe(2);
      expect(summary.ocupacionGlobal).toBe(33.33);
    });

    const request = http.expectOne('/api/v1/propiedades/resumen');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toHaveLength(0);

    request.flush({
      inversionTotal: 3500,
      propiedadesActivas: 2,
      casasActivas: 1,
      edificiosActivos: 1,
      unidadesTotales: 7,
      unidadesHabilitadas: 6,
      unidadesNoHabilitadas: 1,
      unidadesOcupadas: 2,
      ocupacionGlobal: 33.33,
    });
  });

  it('loads a property detail with its confirmed identifier', () => {
    service.get(7).subscribe((property) => expect(property.codprop).toBe(7));

    const detailRequest = http.expectOne('/api/v1/propiedades/7');

    expect(detailRequest.request.method).toBe('GET');
    detailRequest.flush({
      codprop: 7,
      ...request,
      cantidadUnidades: 0,
      unidadesHabilitadas: 0,
      unidadesOcupadas: 0,
      ocupacion: 0,
      tienePortada: false,
    });
  });

  it('creates a property with the complete typed request', () => {
    service.create(request).subscribe((property) => expect(property.codprop).toBe(8));

    const createRequest = http.expectOne('/api/v1/propiedades');

    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(request);
    createRequest.flush({
      codprop: 8,
      ...request,
      cantidadUnidades: 0,
      unidadesHabilitadas: 0,
      unidadesOcupadas: 0,
      ocupacion: 0,
      tienePortada: false,
    });
  });

  it('updates a property with the complete typed request', () => {
    service.update(7, { ...request, estado: 0 }).subscribe((property) => {
      expect(property.estado).toBe(0);
    });

    const updateRequest = http.expectOne('/api/v1/propiedades/7');

    expect(updateRequest.request.method).toBe('PUT');
    expect(updateRequest.request.body).toEqual({ ...request, estado: 0 });
    updateRequest.flush({
      codprop: 7,
      ...request,
      estado: 0,
      cantidadUnidades: 0,
      unidadesHabilitadas: 0,
      unidadesOcupadas: 0,
      ocupacion: 0,
      tienePortada: false,
    });
  });

  it('activates a property through the confirmed PATCH endpoint', () => {
    service.activate(7).subscribe((property) => expect(property.estado).toBe(1));

    const activateRequest = http.expectOne('/api/v1/propiedades/7/activar');

    expect(activateRequest.request.method).toBe('PATCH');
    expect(activateRequest.request.body).toEqual({});
    activateRequest.flush({ codprop: 7, ...request, estado: 1 });
  });

  it('deactivates a property through the confirmed PATCH endpoint', () => {
    service.deactivate(7).subscribe((property) => expect(property.estado).toBe(0));

    const deactivateRequest = http.expectOne('/api/v1/propiedades/7/desactivar');

    expect(deactivateRequest.request.method).toBe('PATCH');
    expect(deactivateRequest.request.body).toEqual({});
    deactivateRequest.flush({ codprop: 7, ...request, estado: 0 });
  });

  it('gets a protected property cover as Blob', () => {
    service.getPortada(7).subscribe((cover) => expect(cover).toBeInstanceOf(Blob));

    const coverRequest = http.expectOne('/api/v1/propiedades/7/portada');

    expect(coverRequest.request.method).toBe('GET');
    coverRequest.flush(new Blob(['cover'], { type: 'image/jpeg' }));
  });

  it('uploads a property cover as multipart form data using the foto part', () => {
    const file = new File(['cover'], 'portada.png', { type: 'image/png' });

    service.uploadPortada(7, file).subscribe();

    const coverRequest = http.expectOne('/api/v1/propiedades/7/portada');

    expect(coverRequest.request.method).toBe('PUT');
    expect(coverRequest.request.body).toBeInstanceOf(FormData);
    expect(coverRequest.request.body.get('foto')).toBe(file);
    coverRequest.flush(null);
  });

  it('deletes a property cover', () => {
    service.deletePortada(7).subscribe();

    const coverRequest = http.expectOne('/api/v1/propiedades/7/portada');

    expect(coverRequest.request.method).toBe('DELETE');
    coverRequest.flush(null);
  });
});
