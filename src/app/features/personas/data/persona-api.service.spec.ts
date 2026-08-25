import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PersonaApiService } from './persona-api.service';

describe('PersonaApiService', () => {
  let service: PersonaApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PersonaApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('maps real server filters and omits Todos', () => {
    service
      .list({ q: ' Ana ', tipoPersona: 'A', estado: 1, page: 0, size: 10, sort: 'ap,asc' })
      .subscribe();
    const request = http.expectOne((r) => r.url === '/api/v1/personas');
    expect(request.request.params.get('q')).toBe('Ana');
    expect(request.request.params.get('tipoPersona')).toBe('A');
    expect(request.request.params.get('estado')).toBe('1');
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.get('size')).toBe('10');
    expect(request.request.params.get('sort')).toBe('ap,asc');
    request.flush({
      content: [],
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    });
  });
  it('gets the server-provided persona summary', () => {
    service
      .resumen()
      .subscribe((resumen) =>
        expect(resumen).toEqual({ totalPersonas: 37, activas: 31, inactivas: 6, conUsuario: 24 }),
      );
    const request = http.expectOne('/api/v1/personas/resumen');
    expect(request.request.method).toBe('GET');
    request.flush({ totalPersonas: 37, activas: 31, inactivas: 6, conUsuario: 24 });
  });
  it('gets protected photos as Blob and uploads multipart photo', () => {
    service.getFoto(15).subscribe((body) => expect(body).toBeInstanceOf(Blob));
    http.expectOne('/api/v1/personas/15/foto').flush(new Blob(['x'], { type: 'image/jpeg' }));
    service.subirFoto(15, new File(['x'], 'foto.png', { type: 'image/png' })).subscribe();
    const request = http.expectOne('/api/v1/personas/15/foto');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toBeInstanceOf(FormData);
    request.flush({});
  });
});
