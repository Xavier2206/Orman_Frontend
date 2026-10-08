import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiPath } from '../../../core/api/api.constants';
import { DashboardResumenFinancieroResponse } from '../models/dashboard-financiero.model';

@Injectable({ providedIn: 'root' })
export class DashboardFinancieroApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = apiPath('/dashboard/resumen-financiero');

  getResumenFinanciero(): Observable<DashboardResumenFinancieroResponse> {
    return this.http.get<DashboardResumenFinancieroResponse>(this.endpoint);
  }
}
