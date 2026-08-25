import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiPath } from '../../../core/api/api.constants';
import { PersonaResumen } from '../models/persona-resumen.model';
import {
  CambiarPasswordRequest,
  CrearUsuarioRequest,
  PageResponse,
  Persona,
  PersonaListFilters,
  PersonaRequest,
} from '../models/persona.model';

@Injectable({ providedIn: 'root' })
export class PersonaApiService {
  private readonly http = inject(HttpClient);
  private readonly personasPath = apiPath('/personas');

  list(filters: PersonaListFilters): Observable<PageResponse<Persona>> {
    let params = new HttpParams()
      .set('page', filters.page)
      .set('size', filters.size)
      .set('sort', filters.sort);
    if (filters.q.trim()) params = params.set('q', filters.q.trim());
    if (filters.tipoPersona) params = params.set('tipoPersona', filters.tipoPersona);
    if (filters.estado !== null) params = params.set('estado', filters.estado);
    return this.http.get<PageResponse<Persona>>(this.personasPath, { params });
  }

  resumen(): Observable<PersonaResumen> {
    return this.http.get<PersonaResumen>(`${this.personasPath}/resumen`);
  }
  get(codper: number): Observable<Persona> {
    return this.http.get<Persona>(`${this.personasPath}/${codper}`);
  }
  create(request: PersonaRequest): Observable<Persona> {
    return this.http.post<Persona>(this.personasPath, request);
  }
  update(codper: number, request: PersonaRequest): Observable<Persona> {
    return this.http.put<Persona>(`${this.personasPath}/${codper}`, request);
  }
  desactivar(codper: number): Observable<Persona> {
    return this.http.patch<Persona>(`${this.personasPath}/${codper}/desactivar`, {});
  }
  activar(codper: number): Observable<Persona> {
    return this.http.patch<Persona>(`${this.personasPath}/${codper}/activar`, {});
  }
  getFoto(codper: number): Observable<Blob> {
    return this.http.get(`${this.personasPath}/${codper}/foto`, { responseType: 'blob' });
  }
  subirFoto(codper: number, foto: File): Observable<Persona> {
    const body = new FormData();
    body.append('foto', foto);
    return this.http.put<Persona>(`${this.personasPath}/${codper}/foto`, body);
  }
  eliminarFoto(codper: number): Observable<void> {
    return this.http.delete<void>(`${this.personasPath}/${codper}/foto`);
  }
  crearUsuario(request: CrearUsuarioRequest): Observable<unknown> {
    return this.http.post(apiPath('/usuarios'), request);
  }
  cambiarPassword(login: string, request: CambiarPasswordRequest): Observable<void> {
    return this.http.put<void>(
      `${apiPath('/usuarios')}/${encodeURIComponent(login)}/password`,
      request,
    );
  }
}
