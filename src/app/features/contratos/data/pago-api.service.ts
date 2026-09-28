import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiPath } from '../../../core/api/api.constants';
import { PagoCreateRequest, PagoResponse } from '../models/contrato.model';

export interface PagoComprobanteMetadata {
  readonly nombreArchivo: string;
  readonly tipoContenido: string;
  readonly fechaRegistro: string;
}

@Injectable({ providedIn: 'root' })
export class PagoApiService {
  private readonly http = inject(HttpClient);

  getById(codpag: number): Observable<PagoResponse> {
    return this.http.get<PagoResponse>(apiPath(`/pagos/${codpag}`));
  }

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

  getReceiptMetadata(codpag: number): Observable<PagoComprobanteMetadata> {
    return this.http.get<PagoComprobanteMetadata>(apiPath(`/pagos/${codpag}/comprobante/metadata`));
  }

  getReceipt(codpag: number): Observable<Blob> {
    return this.http.get(apiPath(`/pagos/${codpag}/comprobante`), { responseType: 'blob' });
  }

  confirmReview(codpag: number): Observable<PagoResponse> {
    return this.http.patch<PagoResponse>(apiPath(`/pagos/${codpag}/confirmar`), null);
  }

  rejectReview(codpag: number, motivo: string): Observable<PagoResponse> {
    return this.http.patch<PagoResponse>(apiPath(`/pagos/${codpag}/rechazar`), { motivo });
  }
}
