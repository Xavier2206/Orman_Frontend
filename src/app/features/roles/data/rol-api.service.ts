import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, expand, reduce } from 'rxjs';

import { apiPath } from '../../../core/api/api.constants';
import { PageResponse } from '../../personas/models/persona.model';
import {
  CreateRolRequest,
  Rol,
  RolListFilters,
  RolResumen,
  UpdateRolRequest,
} from '../models/rol.model';

@Injectable({ providedIn: 'root' })
export class RolApiService {
  private readonly http = inject(HttpClient);
  private readonly rolesPath = apiPath('/roles');

  list(filters: RolListFilters): Observable<PageResponse<Rol>> {
    let params = new HttpParams()
      .set('page', filters.page)
      .set('size', filters.size)
      .set('sort', filters.sort);

    if (filters.q.trim()) {
      params = params.set('q', filters.q.trim());
    }

    if (filters.estado !== null) {
      params = params.set('estado', filters.estado);
    }

    return this.http.get<PageResponse<Rol>>(this.rolesPath, { params });
  }

  listActiveCatalog(): Observable<readonly Rol[]> {
    return this.listActiveCatalogPage(0).pipe(
      expand((response) => (response.last ? EMPTY : this.listActiveCatalogPage(response.page + 1))),
      reduce<PageResponse<Rol>, readonly Rol[]>(
        (roles, response) => [...roles, ...response.content],
        [],
      ),
    );
  }

  resumen(): Observable<RolResumen> {
    return this.http.get<RolResumen>(`${this.rolesPath}/resumen`);
  }

  create(request: CreateRolRequest): Observable<Rol> {
    return this.http.post<Rol>(this.rolesPath, request);
  }

  update(codr: number, request: UpdateRolRequest): Observable<Rol> {
    return this.http.put<Rol>(`${this.rolesPath}/${codr}`, request);
  }

  activate(codr: number): Observable<Rol> {
    return this.http.patch<Rol>(`${this.rolesPath}/${codr}/activar`, {});
  }

  deactivate(codr: number): Observable<Rol> {
    return this.http.patch<Rol>(`${this.rolesPath}/${codr}/desactivar`, {});
  }

  private listActiveCatalogPage(page: number): Observable<PageResponse<Rol>> {
    return this.list({
      q: '',
      estado: 1,
      page,
      size: 10,
      sort: 'nombre,asc',
    });
  }
}
