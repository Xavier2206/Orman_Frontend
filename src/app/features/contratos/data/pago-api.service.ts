import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiPath } from '../../../core/api/api.constants';
import { PagoCreateRequest, PagoResponse } from '../models/contrato.model';

@Injectable({ providedIn: 'root' })
export class PagoApiService {
  private readonly http = inject(HttpClient);

  listByInstallment(codcuo: number): Observable<readonly PagoResponse[]> {
    return this.http.get<readonly PagoResponse[]>(apiPath(`/cuotas/${codcuo}/pagos`));
  }

  create(codcuo: number, request: PagoCreateRequest, comprobante?: File): Observable<PagoResponse> {
    const formData = new FormData();
    const paymentPart = new Blob([JSON.stringify(request)], { type: 'application/json' });
    formData.append('pago', paymentPart);

    if (comprobante) {
      formData.append('comprobante', comprobante);
    }

    return this.http.post<PagoResponse>(apiPath(`/cuotas/${codcuo}/pagos`), formData);
  }

  annul(codpag: number, motivo: string): Observable<PagoResponse> {
    return this.http.patch<PagoResponse>(apiPath(`/pagos/${codpag}/anular`), { motivo });
  }
}
