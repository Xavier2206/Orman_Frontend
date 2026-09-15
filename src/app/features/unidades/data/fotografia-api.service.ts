import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiPath } from '../../../core/api/api.constants';
import {
  UnidadFotoMetadataRequest,
  UnidadFotoResponse,
} from '../models/fotografia.model';

@Injectable({ providedIn: 'root' })
export class FotografiaApiService {
  private readonly http = inject(HttpClient);
  private readonly unidadesPath = apiPath('/unidades');

  list(coduni: number): Observable<readonly UnidadFotoResponse[]> {
    return this.http.get<readonly UnidadFotoResponse[]>(this.photosPath(coduni));
  }

  createInternal(
    coduni: number,
    file: File,
    metadata: UnidadFotoMetadataRequest,
  ): Observable<UnidadFotoResponse> {
    const body = new FormData();
    body.append('foto', file);
    this.appendOptionalText(body, 'titulo', metadata.titulo);
    this.appendOptionalText(body, 'ambiente', metadata.ambiente);
    body.append('orden', String(metadata.orden));

    return this.http.post<UnidadFotoResponse>(this.photosPath(coduni), body);
  }

  getArchivo(coduni: number, id: number): Observable<Blob> {
    return this.http.get(`${this.photosPath(coduni)}/${id}/archivo`, {
      responseType: 'blob',
    });
  }

  updateMetadata(
    coduni: number,
    id: number,
    metadata: UnidadFotoMetadataRequest,
  ): Observable<UnidadFotoResponse> {
    return this.http.patch<UnidadFotoResponse>(
      `${this.photosPath(coduni)}/${id}/metadata`,
      metadata,
    );
  }

  replaceArchivo(coduni: number, id: number, file: File): Observable<UnidadFotoResponse> {
    const body = new FormData();
    body.append('foto', file);

    return this.http.put<UnidadFotoResponse>(
      `${this.photosPath(coduni)}/${id}/archivo`,
      body,
    );
  }

  setPortada(coduni: number, id: number): Observable<UnidadFotoResponse> {
    return this.http.patch<UnidadFotoResponse>(
      `${this.photosPath(coduni)}/${id}/portada`,
      {},
    );
  }

  delete(coduni: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.photosPath(coduni)}/${id}`);
  }

  private photosPath(coduni: number): string {
    return `${this.unidadesPath}/${coduni}/fotos`;
  }

  private appendOptionalText(body: FormData, field: string, value: string | null): void {
    if (value) {
      body.append(field, value);
    }
  }
}
