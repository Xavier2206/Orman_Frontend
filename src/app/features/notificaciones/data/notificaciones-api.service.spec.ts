import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { NotificacionesApiService } from './notificaciones-api.service';

describe('NotificacionesApiService', () => {
  let service: NotificacionesApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificacionesApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the unread summary from the confirmed endpoint', () => {
    let unreadCount: number | undefined;

    service.getSummary().subscribe((summary) => {
      unreadCount = summary.noLeidas;
    });

    const request = http.expectOne('/api/v1/notificaciones/resumen');
    expect(request.request.method).toBe('GET');
    request.flush({ noLeidas: 3 });

    expect(unreadCount).toBe(3);
  });

  it('requests the first page with 20 notifications without changing backend order', () => {
    service.list().subscribe();

    const request = http.expectOne(
      (candidate) =>
        candidate.url === '/api/v1/notificaciones' &&
        candidate.params.get('page') === '0' &&
        candidate.params.get('size') === '20',
    );

    expect(request.request.method).toBe('GET');
    request.flush({
      content: [],
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    });
  });

  it('marks one notification as read with a bodyless PATCH', () => {
    service.markAsRead(14).subscribe();

    const request = http.expectOne('/api/v1/notificaciones/14/leer');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toBeNull();
    request.flush({
      codnot: 14,
      tipo: 'COMPROBANTE_RECIBIDO',
      titulo: 'Comprobante recibido',
      mensaje: 'Se recibió el comprobante.',
      referenciaTipo: 'PAGO',
      referenciaId: 2,
      fechaCreacion: '2026-09-26T10:00:00',
      leida: true,
      fechaLectura: '2026-09-26T10:01:00',
    });
  });
});
