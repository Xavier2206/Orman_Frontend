import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiPath } from '../../../core/api/api.constants';
import { CuotaResponse } from '../models/contrato.model';

@Injectable({ providedIn: 'root' })
export class CuotaApiService {
  private readonly http = inject(HttpClient);

  listByContract(codcon: number): Observable<readonly CuotaResponse[]> {
    return this.http.get<readonly CuotaResponse[]>(apiPath(`/contratos/${codcon}/cuotas`));
  }
}
