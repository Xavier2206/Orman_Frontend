import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';

import { apiPath } from '../../../core/api/api.constants';
import { PageResponse } from '../../personas/models/persona.model';
import {
  Contrato,
  ContratoEstado,
  ContratoListFilters,
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

  getResumen(): Observable<ContratoResumen> {
    const states: readonly ContratoEstado[] = ['VIGENTE', 'PROGRAMADO', 'FINALIZADO', 'RESCINDIDO'];

    return forkJoin(
      states.map((estado) =>
        this.list({
          q: '',
          codprop: null,
          coduni: null,
          estado,
          page: 0,
          size: 1,
          sort: 'fechaInicio,desc',
        }).pipe(map((page) => page.totalElements)),
      ),
    ).pipe(
      map(([vigentes, programados, finalizados, rescindidos]) => ({
        vigentes,
        programados,
        finalizados,
        rescindidos,
      })),
    );
  }
}
