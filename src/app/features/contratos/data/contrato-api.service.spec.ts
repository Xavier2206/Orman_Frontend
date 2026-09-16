import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { ContratoApiService } from './contrato-api.service';

describe('ContratoApiService', () => {
  let service: ContratoApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ContratoApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ContratoApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the paginated contract list with backend-supported filters including q', () => {
    service
      .list({
        q: 'Juan',
        codprop: 10,
        coduni: 12,
        estado: 'VIGENTE',
        page: 1,
        size: 20,
        sort: 'fechaInicio,desc',
      })
      .subscribe();

    const request = http.expectOne((candidate) => candidate.url === '/api/v1/contratos');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('q')).toBe('Juan');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('20');
    expect(request.request.params.get('sort')).toBe('fechaInicio,desc');
    expect(request.request.params.get('coduni')).toBe('12');
    expect(request.request.params.get('codprop')).toBe('10');
    expect(request.request.params.get('estado')).toBe('VIGENTE');
    request.flush({});
  });

  it('omits q, codprop, coduni and estado when they are empty or null', () => {
    service
      .list({
        q: '   ',
        codprop: null,
        coduni: null,
        estado: null,
        page: 0,
        size: 20,
        sort: 'fechaInicio,desc',
      })
      .subscribe();

    const request = http.expectOne((candidate) => candidate.url === '/api/v1/contratos');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.has('q')).toBe(false);
    expect(request.request.params.has('codprop')).toBe(false);
    expect(request.request.params.has('coduni')).toBe(false);
    expect(request.request.params.has('estado')).toBe(false);
    request.flush({});
  });

  it('calculates the global summary from one size-one request per supported state', () => {
    service.getResumen().subscribe((summary) => {
      expect(summary).toEqual({
        vigentes: 3,
        programados: 2,
        finalizados: 4,
        rescindidos: 1,
      });
    });

    const requests = http.match((request) => request.url === '/api/v1/contratos');

    expect(requests).toHaveLength(4);
    expect(requests.map((request) => request.request.params.get('estado'))).toEqual([
      'VIGENTE',
      'PROGRAMADO',
      'FINALIZADO',
      'RESCINDIDO',
    ]);
    requests.forEach((request, index) => request.flush({ totalElements: [3, 2, 4, 1][index] }));
  });
});
