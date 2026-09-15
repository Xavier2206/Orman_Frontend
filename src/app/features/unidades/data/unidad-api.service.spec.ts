import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { PageResponse } from '../../personas/models/persona.model';
import { UnidadRequest, UnidadResponse } from '../models/unidad.model';
import { UnidadApiService } from './unidad-api.service';

describe('UnidadApiService', () => {
  let service: UnidadApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UnidadApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(UnidadApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const request: UnidadRequest = {
    nombre: 'Unidad 101',
    tipoUnidad: 'DEPARTAMENTO',
    descripcion: 'Unidad de prueba',
    area: 45.5,
    dormitorios: 1,
    banos: 1,
    piso: 1,
    ubicacionInterna: 'Torre A',
    precioBase: 2500,
    estadoOperativo: 1,
  };

  it('lists units for the selected property with the confirmed pagination contract', () => {
    const response: PageResponse<UnidadResponse> = {
      content: [
        {
          coduni: 501,
          codprop: 161,
          nombre: 'Unidad 101',
          tipoUnidad: 'DEPARTAMENTO',
          descripcion: null,
          area: 45.5,
          dormitorios: 1,
          banos: 1,
          piso: 1,
          ubicacionInterna: 'Torre A',
          precioBase: 2500,
          estadoOperativo: 1,
        },
      ],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    };

    service.listByProperty(161, 0, 20, 'nombre,asc').subscribe((page) => {
      expect(page).toEqual(response);
    });

    const request = http.expectOne(
      (candidate) => candidate.url === '/api/v1/propiedades/161/unidades',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.get('size')).toBe('20');
    expect(request.request.params.get('sort')).toBe('nombre,asc');
    expect(request.request.params.get('estadoOperativo')).toBeNull();

    request.flush(response);
  });

  it('includes estadoOperativo=1 when requesting operational units', () => {
    service.listByProperty(161, 0, 20, 'nombre,asc', 1).subscribe();

    const operationalRequest = http.expectOne(
      (candidate) =>
        candidate.url === '/api/v1/propiedades/161/unidades' &&
        candidate.params.get('estadoOperativo') === '1',
    );

    expect(operationalRequest.request.method).toBe('GET');
    expect(operationalRequest.request.params.get('estadoOperativo')).toBe('1');

    operationalRequest.flush({
      content: [],
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    });
  });

  it('includes estadoOperativo=0 when requesting non-operational units', () => {
    service.listByProperty(161, 0, 20, 'nombre,asc', 0).subscribe();

    const nonOperationalRequest = http.expectOne(
      (candidate) =>
        candidate.url === '/api/v1/propiedades/161/unidades' &&
        candidate.params.get('estadoOperativo') === '0',
    );

    expect(nonOperationalRequest.request.method).toBe('GET');
    expect(nonOperationalRequest.request.params.get('estadoOperativo')).toBe('0');

    nonOperationalRequest.flush({
      content: [],
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    });
  });

  it('creates a unit with codprop in the URL and not in the request body', () => {
    service.create(161, request).subscribe();

    const createRequest = http.expectOne('/api/v1/propiedades/161/unidades');

    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(request);
    expect(createRequest.request.body).not.toHaveProperty('codprop');

    createRequest.flush({ ...request, coduni: 501, codprop: 161 });
  });

  it('gets and updates a unit through the confirmed endpoints', () => {
    service.get(501).subscribe();
    const getRequest = http.expectOne('/api/v1/unidades/501');
    expect(getRequest.request.method).toBe('GET');
    getRequest.flush({ ...request, coduni: 501, codprop: 161 });

    service.update(501, request).subscribe();
    const updateRequest = http.expectOne('/api/v1/unidades/501');
    expect(updateRequest.request.method).toBe('PUT');
    expect(updateRequest.request.body).toEqual(request);
    expect(updateRequest.request.body).not.toHaveProperty('codprop');
    updateRequest.flush({ ...request, coduni: 501, codprop: 161 });
  });

  it('activates a unit through the dedicated PATCH endpoint and returns UnidadResponse', () => {
    const response: UnidadResponse = { ...request, coduni: 501, codprop: 161 };

    service.activarUnidad(501).subscribe((unit) => {
      expect(unit).toEqual(response);
    });

    const activateRequest = http.expectOne('/api/v1/unidades/501/activar');

    expect(activateRequest.request.method).toBe('PATCH');
    expect(activateRequest.request.body).toEqual({});
    activateRequest.flush(response);
  });

  it('deactivates a unit through the dedicated PATCH endpoint and returns UnidadResponse', () => {
    const response: UnidadResponse = { ...request, coduni: 501, codprop: 161, estadoOperativo: 0 };

    service.desactivarUnidad(501).subscribe((unit) => {
      expect(unit).toEqual(response);
    });

    const deactivateRequest = http.expectOne('/api/v1/unidades/501/desactivar');

    expect(deactivateRequest.request.method).toBe('PATCH');
    expect(deactivateRequest.request.body).toEqual({});
    deactivateRequest.flush(response);
  });
});
