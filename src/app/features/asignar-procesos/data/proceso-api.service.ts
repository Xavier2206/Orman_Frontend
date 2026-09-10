import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';

import { apiPath } from '../../../core/api/api.constants';
import { PageResponse } from '../../personas/models/persona.model';
import { Proceso } from '../models/proceso.model';

@Injectable({ providedIn: 'root' })
export class ProcesoApiService {
  private readonly http = inject(HttpClient);
  private readonly procesosPath = apiPath('/procesos');

  list(page: number, size: number, sort: string): Observable<PageResponse<Proceso>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);

    return this.http.get<PageResponse<Proceso>>(this.procesosPath, { params });
  }

  listCatalog(size = 10, sort = 'nombre,asc'): Observable<readonly Proceso[]> {
    return this.list(0, size, sort).pipe(
      expand((response) => (response.last ? EMPTY : this.list(response.page + 1, size, sort))),
      reduce<PageResponse<Proceso>, readonly Proceso[]>(
        (processes, response) => [...processes, ...response.content],
        [],
      ),
      map((processes) => processes.filter((process) => process.estado === 1)),
    );
  }
}
