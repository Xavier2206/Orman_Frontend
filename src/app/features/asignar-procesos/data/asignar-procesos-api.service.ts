import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiPath } from '../../../core/api/api.constants';
import { MeProResponse } from '../models/me-pro-response.model';

@Injectable({ providedIn: 'root' })
export class AsignarProcesosApiService {
  private readonly http = inject(HttpClient);
  private readonly menusPath = apiPath('/menus');

  listAssignedProcesses(codm: number): Observable<readonly MeProResponse[]> {
    return this.http.get<readonly MeProResponse[]>(`${this.menusPath}/${codm}/procesos`);
  }

  assignProcess(codm: number, codp: number): Observable<MeProResponse> {
    return this.http.post<MeProResponse>(`${this.menusPath}/${codm}/procesos/${codp}`, null);
  }

  removeProcess(codm: number, codp: number): Observable<void> {
    return this.http.delete<void>(`${this.menusPath}/${codm}/procesos/${codp}`);
  }
}
