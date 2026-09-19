import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiPath } from '../../../core/api/api.constants';
import { ContratoArchivoResponse } from '../models/contrato.model';

@Injectable({ providedIn: 'root' })
export class ContratoArchivoService {
  private readonly http = inject(HttpClient);
  private readonly contratosPath = apiPath('/contratos');

  uploadArchivo(codcon: number, archivo: File, orden: number): Observable<ContratoArchivoResponse> {
    const body = new FormData();
    body.append('archivo', archivo, archivo.name);

    const params = new HttpParams().set('orden', orden);

    return this.http.post<ContratoArchivoResponse>(
      `${this.contratosPath}/${codcon}/archivos`,
      body,
      { params },
    );
  }

  listarArchivos(codcon: number): Observable<readonly ContratoArchivoResponse[]> {
    return this.http.get<readonly ContratoArchivoResponse[]>(
      `${this.contratosPath}/${codcon}/archivos`,
    );
  }

  descargarArchivo(codcon: number, codarc: number): Observable<Blob> {
    return this.http.get(`${this.contratosPath}/${codcon}/archivos/${codarc}/download`, {
      responseType: 'blob',
    });
  }

  eliminarArchivo(codcon: number, codarc: number): Observable<void> {
    return this.http.delete<void>(`${this.contratosPath}/${codcon}/archivos/${codarc}`);
  }
}
