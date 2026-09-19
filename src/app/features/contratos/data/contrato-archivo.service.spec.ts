import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ContratoArchivoResponse } from '../models/contrato.model';
import { ContratoArchivoService } from './contrato-archivo.service';

describe('ContratoArchivoService', () => {
  let service: ContratoArchivoService;
  let http: HttpTestingController;

  const response: ContratoArchivoResponse = {
    codarc: 7,
    codcon: 42,
    nombreArchivo: 'contrato firmado.pdf',
    tipoContenido: 'application/pdf',
    tamanoOriginal: 1450,
    tamanoFinal: 1234,
    fechaSubida: '2026-09-16T12:00:00',
    subidoPor: 'propietaria',
    orden: 0,
    almacenadoInternamente: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ContratoArchivoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uploads the PDF as multipart field archivo with the requested order', () => {
    const file = new File(['%PDF-1.7'], 'contrato.pdf', { type: 'application/pdf' });

    service.uploadArchivo(42, file, 0).subscribe();

    const request = http.expectOne('/api/v1/contratos/42/archivos?orden=0');
    const uploadedFile = request.request.body.get('archivo') as File;

    expect(request.request.method).toBe('POST');
    expect(request.request.body instanceof FormData).toBe(true);
    expect(uploadedFile.name).toBe('contrato.pdf');
    expect(uploadedFile.type).toBe('application/pdf');
    request.flush(response);
  });

  it('lists archive metadata without requesting file contents', () => {
    service.listarArchivos(42).subscribe((files) => expect(files).toEqual([response]));

    const request = http.expectOne('/api/v1/contratos/42/archivos');

    expect(request.request.method).toBe('GET');
    request.flush([response]);
  });

  it('downloads one PDF as a Blob and deletes it through the confirmed endpoints', () => {
    service.descargarArchivo(42, 7).subscribe((file) => expect(file.type).toBe('application/pdf'));
    const download = http.expectOne('/api/v1/contratos/42/archivos/7/download');

    expect(download.request.method).toBe('GET');
    expect(download.request.responseType).toBe('blob');
    download.flush(new Blob(['%PDF-1.7'], { type: 'application/pdf' }));

    service.eliminarArchivo(42, 7).subscribe();
    const deletion = http.expectOne('/api/v1/contratos/42/archivos/7');

    expect(deletion.request.method).toBe('DELETE');
    deletion.flush(null);
  });
});
