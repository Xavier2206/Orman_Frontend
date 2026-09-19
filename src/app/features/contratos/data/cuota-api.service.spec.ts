import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CuotaApiService } from './cuota-api.service';

describe('CuotaApiService', () => {
  let service: CuotaApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CuotaApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CuotaApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists the installments of a contract', () => {
    const response = [{
      codcuo: 1,
      codcon: 42,
      periodo: '2026-10-01',
      fechaVencimiento: '2026-10-01',
      monto: 2500,
      montoConfirmado: 0,
      saldo: 2500,
      montoPendienteRevision: 0,
      estado: 'PENDIENTE',
    }];

    service.listByContract(42).subscribe((installments) => {
      expect(installments).toEqual(response);
    });

    const request = http.expectOne('/api/v1/contratos/42/cuotas');
    expect(request.request.method).toBe('GET');
    request.flush(response);
  });
});
