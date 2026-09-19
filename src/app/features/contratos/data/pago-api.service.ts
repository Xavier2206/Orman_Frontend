import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiPath } from '../../../core/api/api.constants';
import { PagoResponse } from '../models/contrato.model';

@Injectable({ providedIn: 'root' })
export class PagoApiService {
  private readonly http = inject(HttpClient);

  listByInstallment(codcuo: number): Observable<readonly PagoResponse[]> {
    return this.http.get<readonly PagoResponse[]>(apiPath(`/cuotas/${codcuo}/pagos`));
  }
}
