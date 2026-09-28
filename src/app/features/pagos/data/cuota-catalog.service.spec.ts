import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CuotaCatalogService } from './cuota-catalog.service';

describe('CuotaCatalogService', () => {
  let service: CuotaCatalogService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CuotaCatalogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses the contracts tenant catalog without querying Personas', () => {
    const tenants = [{ codper: 15, nombreCompleto: 'Valeria Mendoza', ci: '1234567' }];
    service.listInquilinos().subscribe((result) => expect(result).toEqual(tenants));

    const request = http.expectOne('/api/v1/contratos/inquilinos');
    expect(request.request.method).toBe('GET');
    request.flush(tenants);
    http.expectNone('/api/v1/personas');
  });

  it('collects all property pages through PropiedadApiService', () => {
    const properties: Array<{ codprop: number; nombre: string }> = [];
    service.listPropiedades().subscribe((result) => properties.push(...result));

    const firstPage = http.expectOne(
      (request) => request.url === '/api/v1/propiedades' && request.params.get('page') === '0',
    );
    expect(firstPage.request.params.get('size')).toBe('100');
    expect(firstPage.request.params.get('sort')).toBe('nombre,asc');
    firstPage.flush(propertyPage([{ codprop: 3, nombre: 'Edificio Tarija' }], 0, 2));

    const secondPage = http.expectOne(
      (request) => request.url === '/api/v1/propiedades' && request.params.get('page') === '1',
    );
    secondPage.flush(propertyPage([{ codprop: 4, nombre: 'Casa Camargo' }], 1, 2));

    expect(properties.map((property) => property.codprop)).toEqual([3, 4]);
  });

  it('collects all units for the selected property through UnidadApiService', () => {
    const units: Array<{ coduni: number; codprop: number; nombre: string }> = [];
    service.listUnidades(3).subscribe((result) => units.push(...result));

    const request = http.expectOne(
      '/api/v1/propiedades/3/unidades?page=0&size=100&sort=nombre,asc',
    );
    expect(request.request.method).toBe('GET');
    request.flush(unitPage([{ coduni: 8, codprop: 3, nombre: 'Departamento 3B' }], 0, 1));

    expect(units).toEqual([{ coduni: 8, codprop: 3, nombre: 'Departamento 3B' }]);
  });
});

function propertyPage(
  content: readonly { readonly codprop: number; readonly nombre: string }[],
  page: number,
  totalPages: number,
) {
  return {
    content,
    page,
    size: 100,
    totalElements: content.length,
    totalPages,
    first: page === 0,
    last: page + 1 === totalPages,
  };
}

function unitPage(
  content: readonly {
    readonly coduni: number;
    readonly codprop: number;
    readonly nombre: string;
  }[],
  page: number,
  totalPages: number,
) {
  return {
    content,
    page,
    size: 100,
    totalElements: content.length,
    totalPages,
    first: page === 0,
    last: page + 1 === totalPages,
  };
}
