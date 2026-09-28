import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiPath } from '../../../core/api/api.constants';
import { QrCobroCreateRequest, QrCobroEstado, QrCobroResponse } from '../models/qr-cobro.model';

@Injectable({ providedIn: 'root' })
export class QrCobroApiService {
  private readonly http = inject(HttpClient);
  private readonly qrPath = apiPath('/qr-cobro');

  getCurrent(): Observable<QrCobroResponse> {
    return this.http.get<QrCobroResponse>(`${this.qrPath}/vigente`);
  }

  getImage(codqr: number): Observable<Blob> {
    return this.http.get(`${this.qrPath}/${codqr}/imagen`, { responseType: 'blob' });
  }

  list(): Observable<readonly QrCobroResponse[]> {
    return this.http.get<readonly QrCobroResponse[]>(this.qrPath);
  }

  create(request: QrCobroCreateRequest, image: File): Observable<QrCobroResponse> {
    const body = new FormData();
    const metadata = new Blob([JSON.stringify(request)], { type: 'application/json' });
    body.append('qr', metadata);
    body.append('imagen', image, image.name);

    return this.http.post<QrCobroResponse>(this.qrPath, body);
  }

  changeState(codqr: number, estado: QrCobroEstado): Observable<QrCobroResponse> {
    return this.http.patch<QrCobroResponse>(`${this.qrPath}/${codqr}/estado`, { estado });
  }
}
