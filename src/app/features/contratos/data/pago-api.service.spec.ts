import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { PagoApiService } from './pago-api.service';

describe('PagoApiService', () => {
  let service: PagoApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PagoApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PagoApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists payments for an installment', () => {
    const response = [{
      codpag: 7,
      codcuo: 1,
      codcta: null,
      monto: 2500,
      metodo: 'QR',
      referenciaExterna: 'QR-001',
      fechaPago: '2026-10-01T12:00:00',
      fechaRegistro: '2026-10-01T12:01:00',
      estado: 'CONFIRMADO',
      origenRegistro: 'PROPIETARIO',
      registradoPor: 'propietario',
      revisadoPor: 'admin',
      fechaRevision: '2026-10-01T12:05:00',
      motivoRechazo: null,
      motivoAnulacion: null,
    }];

    service.listByInstallment(1).subscribe((payments) => {
      expect(payments).toEqual(response);
    });

    const request = http.expectOne('/api/v1/cuotas/1/pagos');
    expect(request.request.method).toBe('GET');
    request.flush(response);
  });
});
