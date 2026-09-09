import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiPath } from '../../../core/api/api.constants';
import { Menu } from '../../menus/models/menu.model';

@Injectable({ providedIn: 'root' })
export class AsignarMenusApiService {
  private readonly http = inject(HttpClient);
  private readonly rolesPath = apiPath('/roles');

  listAssignedMenus(codr: number): Observable<readonly Menu[]> {
    return this.http.get<readonly Menu[]>(`${this.rolesPath}/${codr}/menus`);
  }

  assignMenu(codr: number, codm: number): Observable<unknown> {
    return this.http.post<unknown>(`${this.rolesPath}/${codr}/menus/${codm}`, null);
  }

  removeMenu(codr: number, codm: number): Observable<unknown> {
    return this.http.delete<unknown>(`${this.rolesPath}/${codr}/menus/${codm}`);
  }
}
