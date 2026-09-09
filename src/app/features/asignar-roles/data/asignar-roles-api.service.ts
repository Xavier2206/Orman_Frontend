import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiPath } from '../../../core/api/api.constants';
import { PageResponse } from '../../personas/models/persona.model';
import { Rol } from '../../roles/models/rol.model';
import { Usuario } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class AsignarRolesApiService {
  private readonly http = inject(HttpClient);
  private readonly usuariosPath = apiPath('/usuarios');
  private readonly userPageSize = 5;

  listUsuarios(page: number, query?: string): Observable<PageResponse<Usuario>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', this.userPageSize)
      .set('sort', 'login,asc');

    const normalizedQuery = query?.trim();

    if (normalizedQuery) {
      params = params.set('q', normalizedQuery);
    }

    return this.http.get<PageResponse<Usuario>>(this.usuariosPath, { params });
  }

  listAssignedRoles(login: string): Observable<readonly Rol[]> {
    return this.http.get<readonly Rol[]>(this.rolesPathForUser(login));
  }

  assignRole(login: string, codr: number): Observable<unknown> {
    return this.http.post<unknown>(`${this.rolesPathForUser(login)}/${codr}`, null);
  }

  removeRole(login: string, codr: number): Observable<unknown> {
    return this.http.delete<unknown>(`${this.rolesPathForUser(login)}/${codr}`);
  }

  private rolesPathForUser(login: string): string {
    return `${this.usuariosPath}/${encodeURIComponent(login)}/roles`;
  }
}
