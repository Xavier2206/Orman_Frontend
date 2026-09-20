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

  it('gets the server-provided contract summary', () => {
    service.resumen().subscribe((resumen) =>
      expect(resumen).toEqual({
        vigentes: 4,
        programados: 2,
        finalizados: 7,
        rescindidos: 1,
      }),
    );

    const request = http.expectOne('/api/v1/contratos/resumen');

    expect(request.request.method).toBe('GET');
    request.flush({ vigentes: 4, programados: 2, finalizados: 7, rescindidos: 1 });
  });

  it('creates a contract under the selected unit using the confirmed request body', () => {
    const requestBody = {
      codperInquilino: 31,
      fechaInicio: '2026-10-01',
      fechaFin: '2027-10-01',
      montoMensual: 2500,
      garantia: 0,
    };

    service.create(25, requestBody).subscribe();

    const request = http.expectOne('/api/v1/unidades/25/contratos');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(requestBody);
    request.flush({
      codcon: 42,
      coduni: 25,
      codperInquilino: 31,
      fechaInicio: '2026-10-01',
      fechaFin: '2027-10-01',
      montoMensual: 2500,
      moneda: 'BOB',
      garantia: 0,
      estado: 'PROGRAMADO',
      fechaRegistro: '2026-09-16T12:00:00',
      fechaRescision: null,
      motivoRescision: null,
      inquilino: null,
      unidad: null,
      propiedad: null,
      cuotas: null,
    });
  });

  it('gets one contract for the document-management detail screen', () => {
    service.get(42).subscribe();

    const request = http.expectOne('/api/v1/contratos/42');

    expect(request.request.method).toBe('GET');
    request.flush({});
  });

  it('rescinds a contract with the selected month and reason', () => {
    const requestBody = {
      fechaRescision: '2026-09-01',
      motivoRescision: 'Entrega anticipada de la unidad',
    };

    service.rescind(42, requestBody).subscribe();

    const request = http.expectOne('/api/v1/contratos/42/rescindir');

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(requestBody);
    request.flush({});
  });

  it('finalizes a contract without a request body', () => {
    service.finalizeContract(42).subscribe();

    const request = http.expectOne('/api/v1/contratos/42/finalizar');

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toBeNull();
    request.flush({});
  });
});
