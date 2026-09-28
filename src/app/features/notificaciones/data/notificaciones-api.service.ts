import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiPath } from '../../../core/api/api.constants';
import {
  NotificacionResponse,
  NotificacionResumenResponse,
  NotificacionesPageResponse,
} from '../models/notificacion.model';

@Injectable({ providedIn: 'root' })
export class NotificacionesApiService {
  private readonly http = inject(HttpClient);
  private readonly notificacionesPath = apiPath('/notificaciones');

  getSummary(): Observable<NotificacionResumenResponse> {
    return this.http.get<NotificacionResumenResponse>(`${this.notificacionesPath}/resumen`);
  }

  list(page = 0, size = 20): Observable<NotificacionesPageResponse> {
    const params = new HttpParams().set('page', page).set('size', size);

    return this.http.get<NotificacionesPageResponse>(this.notificacionesPath, { params });
  }

  markAsRead(codnot: number): Observable<NotificacionResponse> {
    const url = `${this.notificacionesPath}/${codnot}/leer`;

    return this.http.request<NotificacionResponse>('PATCH', url, { body: undefined });
  }
}
