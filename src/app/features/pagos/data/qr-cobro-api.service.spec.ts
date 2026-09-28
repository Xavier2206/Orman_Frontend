import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { QrCobroResponse } from '../models/qr-cobro.model';
import { QrCobroApiService } from './qr-cobro-api.service';

describe('QrCobroApiService', () => {
  let service: QrCobroApiService;
  let http: HttpTestingController;

  const response: QrCobroResponse = {
    codqr: 18,
    fechaInicio: '2026-09-26',
    fechaFin: '2027-09-26',
    estado: 'ACTIVO',
    tieneImagen: true,
    nombreArchivo: 'qr banco.png',
    tipoContenido: 'image/png',
    fechaRegistro: '2026-09-26T12:30:00',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(QrCobroApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('gets the current QR and requests its image as a Blob', () => {
    service.getCurrent().subscribe();
    const currentRequest = http.expectOne('/api/v1/qr-cobro/vigente');
    expect(currentRequest.request.method).toBe('GET');
    currentRequest.flush(response);

    service.getImage(response.codqr).subscribe();
    const imageRequest = http.expectOne('/api/v1/qr-cobro/18/imagen');
    expect(imageRequest.request.method).toBe('GET');
    expect(imageRequest.request.responseType).toBe('blob');
    imageRequest.flush(new Blob(['qr'], { type: 'image/png' }));
  });

  it('lists QR metadata without requesting historical images', () => {
    service.list().subscribe();
    const request = http.expectOne('/api/v1/qr-cobro');
    expect(request.request.method).toBe('GET');
    request.flush([response]);
    http.expectNone('/api/v1/qr-cobro/18/imagen');
  });

  it('posts JSON metadata and the selected image as multipart parts', async () => {
    const image = new File(['qr-image'], 'qr banco.png', { type: 'image/png' });
    service.create({ fechaInicio: '2026-09-26', fechaFin: '2027-09-26' }, image).subscribe();

    const request = http.expectOne('/api/v1/qr-cobro');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeInstanceOf(FormData);
    const metadata = request.request.body.get('qr');
    const uploadedImage = request.request.body.get('imagen');
    expect(metadata).toBeInstanceOf(Blob);
    expect((metadata as Blob).type).toBe('application/json');
    await expect((metadata as Blob).text()).resolves.toBe(
      '{"fechaInicio":"2026-09-26","fechaFin":"2027-09-26"}',
    );
    expect(uploadedImage).toBeInstanceOf(File);
    expect((uploadedImage as File).name).toBe('qr banco.png');
    request.flush(response);
  });

  it('changes the QR state using the confirmed patch endpoint', () => {
    service.changeState(response.codqr, 'INACTIVO').subscribe();
    const deactivateRequest = http.expectOne('/api/v1/qr-cobro/18/estado');
    expect(deactivateRequest.request.method).toBe('PATCH');
    expect(deactivateRequest.request.body).toEqual({ estado: 'INACTIVO' });
    deactivateRequest.flush({ ...response, estado: 'INACTIVO' });

    service.changeState(response.codqr, 'ACTIVO').subscribe();
    const activateRequest = http.expectOne('/api/v1/qr-cobro/18/estado');
    expect(activateRequest.request.body).toEqual({ estado: 'ACTIVO' });
    activateRequest.flush(response);
  });
});
