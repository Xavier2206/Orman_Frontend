import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiPath } from '../../../core/api/api.constants';
import { PageResponse } from '../../personas/models/persona.model';
import { PropiedadRequest } from '../models/propiedad-form.model';
import { Propiedad, PropiedadListFilters } from '../models/propiedad.model';
import { PropiedadResumen } from '../models/propiedad-resumen.model';

@Injectable({ providedIn: 'root' })
export class PropiedadApiService {
  private readonly http = inject(HttpClient);
  private readonly propiedadesPath = apiPath('/propiedades');

  list(filters: PropiedadListFilters): Observable<PageResponse<Propiedad>> {
    let params = new HttpParams()
      .set('page', filters.page)
      .set('size', filters.size)
      .set('sort', filters.sort);

    if (filters.q.trim()) {
      params = params.set('q', filters.q.trim());
    }

    if (filters.tipo) {
      params = params.set('tipo', filters.tipo);
    }

    if (filters.estado !== null) {
      params = params.set('estado', filters.estado);
    }

    return this.http.get<PageResponse<Propiedad>>(this.propiedadesPath, { params });
  }

  getResumen(): Observable<PropiedadResumen> {
    return this.http.get<PropiedadResumen>(`${this.propiedadesPath}/resumen`);
  }

  get(codprop: number): Observable<Propiedad> {
    return this.http.get<Propiedad>(`${this.propiedadesPath}/${codprop}`);
  }

  getPortada(codprop: number): Observable<Blob> {
    return this.http.get(`${this.propiedadesPath}/${codprop}/portada`, {
      responseType: 'blob',
    });
  }

  uploadPortada(codprop: number, file: File): Observable<void> {
    const body = new FormData();
    body.append('foto', file);

    return this.http.put<void>(`${this.propiedadesPath}/${codprop}/portada`, body);
  }

  deletePortada(codprop: number): Observable<void> {
    return this.http.delete<void>(`${this.propiedadesPath}/${codprop}/portada`);
  }

  create(request: PropiedadRequest): Observable<Propiedad> {
    return this.http.post<Propiedad>(this.propiedadesPath, request);
  }

  update(codprop: number, request: PropiedadRequest): Observable<Propiedad> {
    return this.http.put<Propiedad>(`${this.propiedadesPath}/${codprop}`, request);
  }

  activate(codprop: number): Observable<Propiedad> {
    return this.http.patch<Propiedad>(`${this.propiedadesPath}/${codprop}/activar`, {});
  }

  deactivate(codprop: number): Observable<Propiedad> {
    return this.http.patch<Propiedad>(`${this.propiedadesPath}/${codprop}/desactivar`, {});
  }
}
