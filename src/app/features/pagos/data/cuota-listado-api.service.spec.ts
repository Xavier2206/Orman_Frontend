import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CuotaListadoApiService } from './cuota-listado-api.service';

describe('CuotaListadoApiService', () => {
  let service: CuotaListadoApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CuotaListadoApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests page zero with size twenty by default and no empty filters or sort', () => {
    service
      .list({
        codperInquilino: null,
        periodo: null,
        estado: null,
        vencimiento: null,
        codprop: null,
        coduni: null,
        conPagoPendienteRevision: false,
        page: 0,
        size: 20,
      })
      .subscribe();

    const request = http.expectOne('/api/v1/cuotas?page=0&size=20');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.has('sort')).toBe(false);
    request.flush(emptyPage());
  });

  it('sends combined filters and the first day of the selected month without sort', () => {
    service
      .list({
        codperInquilino: 15,
        periodo: '2026-09-01',
        estado: 'PARCIAL',
        vencimiento: 'VENCIDAS',
        codprop: 3,
        coduni: 8,
        conPagoPendienteRevision: true,
        page: 0,
        size: 20,
      })
      .subscribe();

    const request = http.expectOne((candidate) => candidate.url === '/api/v1/cuotas');

    expect(request.request.params.keys().sort()).toEqual([
      'codperInquilino',
      'codprop',
      'coduni',
      'conPagoPendienteRevision',
      'estado',
      'page',
      'periodo',
      'size',
      'vencimiento',
    ]);
    expect(request.request.params.get('codperInquilino')).toBe('15');
    expect(request.request.params.get('periodo')).toBe('2026-09-01');
    expect(request.request.params.get('estado')).toBe('PARCIAL');
    expect(request.request.params.get('vencimiento')).toBe('VENCIDAS');
    expect(request.request.params.get('codprop')).toBe('3');
    expect(request.request.params.get('coduni')).toBe('8');
    expect(request.request.params.get('conPagoPendienteRevision')).toBe('true');
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.get('size')).toBe('20');
    expect(request.request.params.has('sort')).toBe(false);
    request.flush(emptyPage());
  });

  it('omits conPagoPendienteRevision when the review filter is false', () => {
    service
      .list({
        codperInquilino: null,
        periodo: null,
        estado: null,
        vencimiento: null,
        codprop: null,
        coduni: null,
        conPagoPendienteRevision: false,
        page: 1,
        size: 20,
      })
      .subscribe();

    const request = http.expectOne((candidate) => candidate.url === '/api/v1/cuotas');

    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.has('conPagoPendienteRevision')).toBe(false);
    request.flush(emptyPage(1));
  });

  it('requests one cuota by codcuo without adding empty optional filters', () => {
    service
      .list({
        codcuo: 1894,
        codperInquilino: null,
        periodo: null,
        estado: null,
        vencimiento: null,
        codprop: null,
        coduni: null,
        conPagoPendienteRevision: false,
        page: 0,
        size: 20,
      })
      .subscribe();

    const request = http.expectOne('/api/v1/cuotas?page=0&size=20&codcuo=1894');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys().sort()).toEqual(['codcuo', 'page', 'size']);
    request.flush(emptyPage());
  });
});

function emptyPage(page: number = 0) {
  return {
    content: [],
    page,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  };
}
