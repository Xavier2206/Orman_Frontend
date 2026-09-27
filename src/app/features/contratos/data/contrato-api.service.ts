import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiPath } from '../../../core/api/api.constants';
import { PageResponse } from '../../personas/models/persona.model';
import {
  Contrato,
  ContratoCreateRequest,
  ContratoInquilino,
  ContratoListFilters,
  ContratoRescindRequest,
  ContratoResumen,
} from '../models/contrato.model';

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

  resumen(): Observable<ContratoResumen> {
    return this.http.get<ContratoResumen>(`${this.contratosPath}/resumen`);
  }

  listInquilinos(): Observable<readonly ContratoInquilino[]> {
    return this.http.get<readonly ContratoInquilino[]>(`${this.contratosPath}/inquilinos`);
  }

  create(coduni: number, request: ContratoCreateRequest): Observable<Contrato> {
    return this.http.post<Contrato>(apiPath(`/unidades/${coduni}/contratos`), request);
  }

  get(codcon: number): Observable<Contrato> {
    return this.http.get<Contrato>(`${this.contratosPath}/${codcon}`);
  }

  rescind(codcon: number, request: ContratoRescindRequest): Observable<Contrato> {
    return this.http.patch<Contrato>(`${this.contratosPath}/${codcon}/rescindir`, request);
  }

  finalizeContract(codcon: number): Observable<Contrato> {
    return this.http.patch<Contrato>(`${this.contratosPath}/${codcon}/finalizar`, undefined);
  }
}
