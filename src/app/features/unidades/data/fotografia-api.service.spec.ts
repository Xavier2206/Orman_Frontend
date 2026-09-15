import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { UnidadFotoMetadataRequest, UnidadFotoResponse } from '../models/fotografia.model';
import { FotografiaApiService } from './fotografia-api.service';

describe('FotografiaApiService', () => {
  let service: FotografiaApiService;
  let http: HttpTestingController;

  const response: UnidadFotoResponse = {
    id: 20,
    coduni: 501,
    url: null,
    titulo: 'Sala',
    ambiente: 'Sala',
    orden: 0,
    portada: false,
    tieneArchivo: true,
  };
  const metadata: UnidadFotoMetadataRequest = {
    titulo: 'Sala',
    ambiente: 'Sala',
    orden: 0,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FotografiaApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses the confirmed list and multipart create endpoints', () => {
    service.list(501).subscribe();
    const listRequest = http.expectOne('/api/v1/unidades/501/fotos');
    expect(listRequest.request.method).toBe('GET');
    listRequest.flush([response]);

    service.createInternal(501, new File(['image'], 'sala.jpg', { type: 'image/jpeg' }), metadata).subscribe();
    const createRequest = http.expectOne('/api/v1/unidades/501/fotos');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toBeInstanceOf(FormData);
    expect(createRequest.request.body.get('foto')).toBeInstanceOf(File);
    expect(createRequest.request.body.get('titulo')).toBe('Sala');
    expect(createRequest.request.body.get('ambiente')).toBe('Sala');
    expect(createRequest.request.body.get('orden')).toBe('0');
    createRequest.flush(response);
  });

  it('uses blob, metadata, replacement, cover and delete endpoints', () => {
    service.getArchivo(501, 20).subscribe();
    const blobRequest = http.expectOne('/api/v1/unidades/501/fotos/20/archivo');
    expect(blobRequest.request.method).toBe('GET');
    expect(blobRequest.request.responseType).toBe('blob');
    blobRequest.flush(new Blob(['image'], { type: 'image/jpeg' }));

    service.updateMetadata(501, 20, metadata).subscribe();
    const metadataRequest = http.expectOne('/api/v1/unidades/501/fotos/20/metadata');
    expect(metadataRequest.request.method).toBe('PATCH');
    expect(metadataRequest.request.body).toEqual(metadata);
    metadataRequest.flush(response);

    service.replaceArchivo(501, 20, new File(['image'], 'nuevo.png', { type: 'image/png' })).subscribe();
    const replacementRequest = http.expectOne('/api/v1/unidades/501/fotos/20/archivo');
    expect(replacementRequest.request.method).toBe('PUT');
    expect(replacementRequest.request.body).toBeInstanceOf(FormData);
    replacementRequest.flush(response);

    service.setPortada(501, 20).subscribe();
    const coverRequest = http.expectOne('/api/v1/unidades/501/fotos/20/portada');
    expect(coverRequest.request.method).toBe('PATCH');
    coverRequest.flush({ ...response, portada: true });

    service.delete(501, 20).subscribe();
    const deleteRequest = http.expectOne('/api/v1/unidades/501/fotos/20');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);
  });
});
