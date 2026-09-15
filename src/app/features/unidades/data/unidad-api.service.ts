import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiPath } from '../../../core/api/api.constants';
import { PageResponse } from '../../personas/models/persona.model';
import { UnidadEstadoOperativo, UnidadRequest, UnidadResponse } from '../models/unidad.model';

@Injectable({ providedIn: 'root' })
export class UnidadApiService {
  private readonly http = inject(HttpClient);
  private readonly propiedadesPath = apiPath('/propiedades');
  private readonly unidadesPath = apiPath('/unidades');

  listByProperty(
    codprop: number,
    page: number,
    size: number,
    sort: string,
    estadoOperativo: UnidadEstadoOperativo | null = null,
  ): Observable<PageResponse<UnidadResponse>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', sort);

    if (estadoOperativo !== null) {
      params = params.set('estadoOperativo', estadoOperativo);
    }

    return this.http.get<PageResponse<UnidadResponse>>(
      `${this.propiedadesPath}/${codprop}/unidades`,
      { params },
    );
  }

  create(codprop: number, request: UnidadRequest): Observable<UnidadResponse> {
    return this.http.post<UnidadResponse>(`${this.propiedadesPath}/${codprop}/unidades`, request);
  }

  get(coduni: number): Observable<UnidadResponse> {
    return this.http.get<UnidadResponse>(`${this.unidadesPath}/${coduni}`);
  }

  update(coduni: number, request: UnidadRequest): Observable<UnidadResponse> {
    return this.http.put<UnidadResponse>(`${this.unidadesPath}/${coduni}`, request);
  }

  activarUnidad(coduni: number): Observable<UnidadResponse> {
    return this.http.patch<UnidadResponse>(`${this.unidadesPath}/${coduni}/activar`, {});
  }

  desactivarUnidad(coduni: number): Observable<UnidadResponse> {
    return this.http.patch<UnidadResponse>(`${this.unidadesPath}/${coduni}/desactivar`, {});
  }
}
