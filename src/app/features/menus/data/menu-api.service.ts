import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiPath } from '../../../core/api/api.constants';
import { PageResponse } from '../../personas/models/persona.model';
import {
  CreateMenuRequest,
  Menu,
  MenuListParams,
  MenuResumen,
  UpdateMenuRequest,
} from '../models/menu.model';

@Injectable({ providedIn: 'root' })
export class MenuApiService {
  private readonly http = inject(HttpClient);
  private readonly menusPath = apiPath('/menus');

  list(filters: MenuListParams): Observable<PageResponse<Menu>> {
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

    return this.http.get<PageResponse<Menu>>(this.menusPath, { params });
  }

  resumen(): Observable<MenuResumen> {
    return this.http.get<MenuResumen>(this.menusPath + '/resumen');
  }

  create(request: CreateMenuRequest): Observable<Menu> {
    return this.http.post<Menu>(this.menusPath, request);
  }

  update(codm: number, request: UpdateMenuRequest): Observable<Menu> {
    return this.http.put<Menu>(this.menusPath + '/' + codm, request);
  }

  activate(codm: number): Observable<Menu> {
    return this.http.patch<Menu>(this.menusPath + '/' + codm + '/activar', null);
  }

  deactivate(codm: number): Observable<Menu> {
    return this.http.patch<Menu>(this.menusPath + '/' + codm + '/desactivar', null);
  }
}
