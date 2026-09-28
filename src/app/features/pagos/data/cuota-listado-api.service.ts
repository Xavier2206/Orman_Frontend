import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiPath } from '../../../core/api/api.constants';
import { PageResponse } from '../../personas/models/persona.model';
import { CuotaListado, CuotaListadoFilters } from '../models/cuota-listado.model';

@Injectable({ providedIn: 'root' })
export class CuotaListadoApiService {
  private readonly http = inject(HttpClient);
  private readonly cuotasPath = apiPath('/cuotas');

  list(filters: CuotaListadoFilters): Observable<PageResponse<CuotaListado>> {
    let params = new HttpParams().set('page', filters.page).set('size', filters.size);

    if (filters.codcuo != null) {
      params = params.set('codcuo', filters.codcuo);
    }

    if (filters.codperInquilino !== null) {
      params = params.set('codperInquilino', filters.codperInquilino);
    }

    if (filters.periodo !== null) {
      params = params.set('periodo', filters.periodo);
    }

    if (filters.estado !== null) {
      params = params.set('estado', filters.estado);
    }

    if (filters.vencimiento !== null) {
      params = params.set('vencimiento', filters.vencimiento);
    }

    if (filters.codprop !== null) {
      params = params.set('codprop', filters.codprop);
    }

    if (filters.coduni !== null) {
      params = params.set('coduni', filters.coduni);
    }

    if (filters.conPagoPendienteRevision) {
      params = params.set('conPagoPendienteRevision', true);
    }

    return this.http.get<PageResponse<CuotaListado>>(this.cuotasPath, { params });
  }
}
