import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { PagoCreateRequest, PagoResponse } from '../models/contrato.model';
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

  it('gets a payment by its identifier', () => {
    const response = paymentResponse(1894);

    service.getById(response.codpag).subscribe((payment) => {
      expect(payment).toEqual(response);
    });

    const request = http.expectOne('/api/v1/pagos/9');
    expect(request.request.method).toBe('GET');
    request.flush(response);
  });

  it('lists payments for an installment using the backend response fields', () => {
    const response: PagoResponse[] = [paymentResponse()];

    service.listByInstallment(1).subscribe((payments) => {
      expect(payments).toEqual(response);
    });

    const request = http.expectOne('/api/v1/cuotas/1/pagos');
    expect(request.request.method).toBe('GET');
    request.flush(response);
  });

  it('registers EFECTIVO as FormData with only the JSON pago part', async () => {
    const requestBody: PagoCreateRequest = {
      monto: 500,
      metodo: 'EFECTIVO',
      idempotencyKey: '11111111-1111-4111-8111-111111111111',
    };

    service.create(27, requestBody).subscribe();

    const request = http.expectOne('/api/v1/cuotas/27/pagos');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeInstanceOf(FormData);
    const formData = request.request.body as FormData;
    expect(await readPagoPart(formData)).toEqual(requestBody);
    expect(formData.has('comprobante')).toBe(false);
    expect(request.request.headers.has('Content-Type')).toBe(false);
    request.flush(paymentResponse(27), { status: 201, statusText: 'Created' });
  });

  it('registers QR without adding a comprobante part when no file is selected', async () => {
    const requestBody: PagoCreateRequest = {
      monto: 75,
      metodo: 'QR',
      fechaPago: '2026-09-25T08:45:00',
      idempotencyKey: '22222222-2222-4222-8222-222222222222',
    };

    service.create(28, requestBody).subscribe();

    const request = http.expectOne('/api/v1/cuotas/28/pagos');
    const formData = request.request.body as FormData;
    expect(await readPagoPart(formData)).toEqual(requestBody);
    expect([...formData.keys()]).toEqual(['pago']);
    expect(request.request.headers.has('Content-Type')).toBe(false);
    request.flush(paymentResponse(28), { status: 201, statusText: 'Created' });
  });

  it('includes the selected image as a separate comprobante part for QR', async () => {
    const requestBody: PagoCreateRequest = {
      monto: 125.5,
      metodo: 'QR',
      fechaPago: '2026-09-25T18:30:00',
      idempotencyKey: '33333333-3333-4333-8333-333333333333',
    };
    const receipt = new File(['image bytes'], 'comprobante.jpg', { type: 'image/jpeg' });

    service.create(29, requestBody, receipt).subscribe();

    const request = http.expectOne('/api/v1/cuotas/29/pagos');
    const formData = request.request.body as FormData;
    expect(await readPagoPart(formData)).toEqual(requestBody);
    const uploadedFile = formData.get('comprobante') as File;
    expect(uploadedFile.name).toBe('comprobante.jpg');
    expect(uploadedFile.type).toBe('image/jpeg');
    expect([...formData.keys()]).toEqual(['pago', 'comprobante']);
    expect(request.request.headers.has('Content-Type')).toBe(false);
    request.flush(paymentResponse(29), { status: 201, statusText: 'Created' });
  });

  it('annuls a payment with the confirmed JSON contract and returns PagoResponse', () => {
    const requestBody = { motivo: 'Registro equivocado' };
    const response: PagoResponse = {
      ...paymentResponse(),
      codpag: 25,
      estado: 'ANULADO',
      motivoAnulacion: requestBody.motivo,
    };

    service.annul(25, requestBody.motivo).subscribe((payment) => {
      expect(payment).toEqual(response);
    });

    const request = http.expectOne('/api/v1/pagos/25/anular');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(requestBody);
    expect(request.request.body).not.toBeInstanceOf(FormData);
    request.flush(response);
  });

  it('loads receipt metadata from the private payment endpoint', () => {
    const metadata = {
      nombreArchivo: 'comprobante.png',
      tipoContenido: 'image/png',
      fechaRegistro: '2026-09-27T10:15:00',
    };

    service.getReceiptMetadata(31).subscribe((result) => {
      expect(result).toEqual(metadata);
    });

    const request = http.expectOne('/api/v1/pagos/31/comprobante/metadata');
    expect(request.request.method).toBe('GET');
    request.flush(metadata);
  });

  it('loads the private receipt as a blob through HttpClient', () => {
    const receipt = new Blob(['image bytes'], { type: 'image/jpeg' });

    service.getReceipt(32).subscribe((result) => {
      expect(result.type).toBe('image/jpeg');
      expect(result.size).toBe(receipt.size);
    });

    const request = http.expectOne('/api/v1/pagos/32/comprobante');
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    request.flush(receipt);
  });

  it('confirms a payment with a PATCH that has no request body', () => {
    const response = paymentResponse();

    service.confirmReview(response.codpag).subscribe((payment) => {
      expect(payment).toEqual(response);
    });

    const request = http.expectOne('/api/v1/pagos/9/confirmar');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toBeNull();
    request.flush(response);
  });

  it('rejects a payment with only the trimmed motivo field', () => {
    const response = paymentResponse();

    service.rejectReview(response.codpag, 'Comprobante ilegible').subscribe((payment) => {
      expect(payment).toEqual(response);
    });

    const request = http.expectOne('/api/v1/pagos/9/rechazar');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ motivo: 'Comprobante ilegible' });
    expect(Object.keys(request.request.body)).toEqual(['motivo']);
    request.flush(response);
  });
});

async function readPagoPart(formData: FormData): Promise<unknown> {
  const paymentPart = formData.get('pago');
  expect(paymentPart).toBeInstanceOf(Blob);
  expect((paymentPart as Blob).type).toBe('application/json');

  return JSON.parse(await (paymentPart as Blob).text());
}

function paymentResponse(codcuo = 27): PagoResponse {
  return {
    codpag: 9,
    codcuo,
    codqr: null,
    monto: 500,
    metodo: 'EFECTIVO',
    fechaPago: '2026-09-25T18:30:00',
    fechaRegistro: '2026-09-25T18:30:00',
    estado: 'CONFIRMADO',
    origenRegistro: 'PROPIETARIA',
    registradoPor: 'owner',
    revisadoPor: null,
    fechaRevision: null,
    motivoRechazo: null,
    motivoAnulacion: null,
  };
}
