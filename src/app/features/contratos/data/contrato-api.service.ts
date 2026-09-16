import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiPath } from '../../../core/api/api.constants';
import { PageResponse } from '../../personas/models/persona.model';
import { Contrato, ContratoListFilters } from '../models/contrato.model';

@Injectable({ providedIn: 'root' })
export class ContratoApiService {
  private readonly http = inject(HttpClient);
  private readonly contratosPath = apiPath('/contratos');

  list(filters: ContratoListFilters): Observable<PageResponse<Contrato>> {
    let params = new HttpParams()
      .set('page', filters.page)
      .set('size', filters.size)
      .set('sort', filters.sort);

    const query = filters.q?.trim();
    if (query) {
      params = params.set('q', query);
    }

    if (filters.coduni !== null) {
      params = params.set('coduni', filters.coduni);
    }

    if (filters.codprop !== null) {
      params = params.set('codprop', filters.codprop);
    }

    if (filters.estado !== null) {
      params = params.set('estado', filters.estado);
    }

    return this.http.get<PageResponse<Contrato>>(this.contratosPath, { params });
  }
}
