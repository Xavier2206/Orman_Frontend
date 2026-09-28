import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { PagoResponse } from '../../contratos/models/contrato.model';
import { PagoRevisionLookupService, PagoRevisionLookup } from './pago-revision-lookup.service';

describe('PagoRevisionLookupService', () => {
  let service: PagoRevisionLookupService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PagoRevisionLookupService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PagoRevisionLookupService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('resolves only real tenant payments pending review for cuotas with pending amounts', () => {
    let result: PagoRevisionLookup | undefined;
    service.loadForQuotas([quota(101, 500), quota(102, 0)]).subscribe((lookup) => {
      result = lookup;
    });

    const request = http.expectOne('/api/v1/cuotas/101/pagos');
    expect(request.request.method).toBe('GET');
    request.flush([
      payment({ codpag: 801, codcuo: 101 }),
      payment({ codpag: 802, codcuo: 101, estado: 'CONFIRMADO' }),
      payment({ codpag: 803, codcuo: 101, origenRegistro: 'PROPIETARIA' }),
      payment({ codpag: 804, codcuo: 102 }),
    ]);

    expect(result?.pagosPorCuota.get(101)?.map((item) => item.codpag)).toEqual([801]);
    expect(result?.pagosPorCuota.has(102)).toBe(false);
    expect(result?.cuotasConError.size).toBe(0);
    http.expectNone('/api/v1/cuotas/102/pagos');
  });

  it('records a lookup failure without exposing a review action', () => {
    let result: PagoRevisionLookup | undefined;
    service.loadForQuotas([quota(103, 250)]).subscribe((lookup) => {
      result = lookup;
    });

    http
      .expectOne('/api/v1/cuotas/103/pagos')
      .flush({}, { status: 500, statusText: 'Internal Server Error' });

    expect(result?.pagosPorCuota.size).toBe(0);
    expect(result?.cuotasConError.has(103)).toBe(true);
  });
});

function quota(codcuo: number, montoPendienteRevision: number) {
  return {
    codcuo,
    codcon: 77,
    periodo: '2026-09',
    fechaVencimiento: '2026-09-05',
    monto: 2500,
    montoConfirmado: 0,
    saldo: 2500,
    montoPendienteRevision,
    estado: 'PENDIENTE' as const,
    codperInquilino: 15,
    nombreCompleto: 'Valeria Mendoza',
    ci: '1234567',
    codprop: 3,
    nombrePropiedad: 'Edificio Tarija',
    coduni: 8,
    nombreUnidad: 'Departamento 3B',
    situacionVencimiento: 'VENCIDA' as const,
  };
}

function payment(overrides: Partial<PagoResponse> = {}): PagoResponse {
  return {
    codpag: 801,
    codcuo: 101,
    codqr: 6,
    monto: 500,
    metodo: 'QR',
    fechaPago: '2026-09-27T10:00:00',
    fechaRegistro: '2026-09-27T10:00:00',
    estado: 'PENDIENTE_REVISION',
    origenRegistro: 'INQUILINO',
    registradoPor: 'tenant',
    revisadoPor: null,
    fechaRevision: null,
    motivoRechazo: null,
    motivoAnulacion: null,
    ...overrides,
  };
}
