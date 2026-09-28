import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';
import { authInterceptor } from '../../../../core/auth/auth.interceptor';
import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { PagoResponse } from '../../../contratos/models/contrato.model';
import { NotificacionResponse, NotificacionesPageResponse } from '../../models/notificacion.model';
import { NotificacionesBellComponent } from './notificaciones-bell.component';

describe('NotificacionesBellComponent navigation', () => {
  let fixture: ComponentFixture<NotificacionesBellComponent>;
  let auth: AuthService;
  let http: HttpTestingController;
  let router: Router;
  let notification: { error: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    notification = { error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [NotificacionesBellComponent],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: OrmanNotificationService, useValue: notification },
      ],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(NotificacionesBellComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    auth.clearSession();
    http.verify();
    vi.restoreAllMocks();
  });

  it('marks an unread receipt as read, updates the badge and navigates to the payment cuota', async () => {
    authenticate(3);
    await loadNotification(createNotification());

    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    clickNotification();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();

    const patch = http.expectOne('/api/v1/notificaciones/41/leer');
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toBeNull();
    patch.flush(createNotification({ leida: true, fechaLectura: '2026-09-26T11:00:00' }));
    fixture.detectChanges();

    expect(badgeText()).toBe('2');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();

    const paymentRequest = http.expectOne('/api/v1/pagos/748');
    expect(paymentRequest.request.method).toBe('GET');
    paymentRequest.flush(paymentResponse(748, 1894));
    await expectNavigation(1894);
  });

  it('opens an already-read receipt without repeating PATCH leer', async () => {
    authenticate(0);
    await loadNotification(
      createNotification({ leida: true, fechaLectura: '2026-09-26T11:00:00' }),
    );

    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    clickNotification();

    http.expectNone('/api/v1/notificaciones/41/leer');
    http.expectOne('/api/v1/pagos/748').flush(paymentResponse(748, 1894));
    await expectNavigation(1894);
  });

  it.each([
    ['CUOTA_VENCIDA', 3044],
    ['CUOTA_PROXIMA_VENCER', 3045],
  ])('uses the cuota reference directly for %s', async (tipo, codcuo) => {
    authenticate(1);
    await loadNotification(
      createNotification({
        tipo,
        referenciaTipo: 'CUOTA',
        referenciaId: codcuo,
        leida: true,
        fechaLectura: '2026-09-26T11:00:00',
      }),
    );

    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    clickNotification();

    http.expectNone('/api/v1/notificaciones/41/leer');
    http.expectNone('/api/v1/pagos/748');
    await expectNavigation(codcuo);
  });

  it.each(['PAGO_CONFIRMADO', 'PAGO_RECHAZADO'])(
    'resolves the payment reference for %s',
    async (tipo) => {
      authenticate(0);
      await loadNotification(
        createNotification({ tipo, leida: true, fechaLectura: '2026-09-26T11:00:00' }),
      );

      vi.spyOn(router, 'navigate').mockResolvedValue(true);
      clickNotification();

      http.expectOne('/api/v1/pagos/748').flush(paymentResponse(748, 1894));
      await expectNavigation(1894);
    },
  );

  it('reports a payment lookup error and does not navigate to a quota', async () => {
    authenticate(0);
    await loadNotification(
      createNotification({ leida: true, fechaLectura: '2026-09-26T11:00:00' }),
    );

    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    clickNotification();
    http
      .expectOne('/api/v1/pagos/748')
      .flush({ detail: 'Pago no encontrado.' }, { status: 404, statusText: 'Not Found' });

    await vi.waitFor(() =>
      expect(notification.error).toHaveBeenCalledWith('No se pudo abrir el pago relacionado.'),
    );
    expect(navigate).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector('[aria-haspopup="dialog"]'),
    );
  });

  it('continues navigation after PATCH leer fails and preserves the unread count', async () => {
    authenticate(1);
    await loadNotification(createNotification());

    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    clickNotification();
    http
      .expectOne('/api/v1/notificaciones/41/leer')
      .flush({ detail: 'No se pudo marcar.' }, { status: 500, statusText: 'Server Error' });
    http.expectOne('/api/v1/pagos/748').flush(paymentResponse(748, 1894));

    await expectNavigation(1894);
    expect(badgeText()).toBe('1');
    expect(notification.error).toHaveBeenCalledWith(
      'No se pudo marcar como leída. Se abrirá la referencia.',
    );
  });

  it('does not decrement the badge below zero when the unread total is already zero', async () => {
    authenticate(0);
    await loadNotification(createNotification());
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    clickNotification();

    http
      .expectOne('/api/v1/notificaciones/41/leer')
      .flush(createNotification({ leida: true, fechaLectura: '2026-09-26T11:00:00' }));
    expect(badgeText()).toBeNull();
    http.expectOne('/api/v1/pagos/748').flush(paymentResponse(748, 1894));
    await expectNavigation(1894);
  });

  function authenticate(unreadCount: number): void {
    auth.login('propietaria', 'password-demo').subscribe();
    http.expectOne('/api/v1/auth/login').flush({
      status: 'AUTHENTICATED',
      login: 'propietaria',
      codper: 10,
      accessToken: 'access-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      sid: 'session-id',
    });
    fixture.detectChanges();
    http.expectOne('/api/v1/notificaciones/resumen').flush({ noLeidas: unreadCount });
    fixture.detectChanges();
  }

  async function loadNotification(notification: NotificacionResponse): Promise<void> {
    const trigger = fixture.nativeElement.querySelector(
      '[aria-haspopup="dialog"]',
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    http
      .expectOne((request) => request.url === '/api/v1/notificaciones')
      .flush(createPage([notification]));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function clickNotification(): void {
    const button = fixture.nativeElement.querySelector(
      'button[aria-label="Abrir notificación: Comprobante recibido"]',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
  }

  function badgeText(): string | null {
    return (
      fixture.nativeElement.querySelector('.notification-count-badge')?.textContent?.trim() ?? null
    );
  }

  async function expectNavigation(codcuo: number): Promise<void> {
    await vi.waitFor(() =>
      expect(router.navigate).toHaveBeenCalledWith(['/app/pagos/listar'], {
        queryParams: { codcuo },
      }),
    );
  }
});

function createNotification(overrides: Partial<NotificacionResponse> = {}): NotificacionResponse {
  return {
    codnot: 41,
    tipo: 'COMPROBANTE_RECIBIDO',
    titulo: 'Comprobante recibido',
    mensaje: 'Se registró un comprobante para la cuota 1894.',
    referenciaTipo: 'PAGO',
    referenciaId: 748,
    fechaCreacion: '2026-09-26T10:00:00',
    leida: false,
    fechaLectura: null,
    ...overrides,
  };
}

function createPage(content: readonly NotificacionResponse[]): NotificacionesPageResponse {
  return {
    content,
    page: 0,
    size: 20,
    totalElements: content.length,
    totalPages: content.length > 0 ? 1 : 0,
    first: true,
    last: true,
  };
}

function paymentResponse(codpag: number, codcuo: number): PagoResponse {
  return {
    codpag,
    codcuo,
    codqr: null,
    monto: 500,
    metodo: 'EFECTIVO',
    fechaPago: '2026-09-25T18:30:00',
    fechaRegistro: '2026-09-25T18:30:00',
    estado: 'CONFIRMADO',
    origenRegistro: 'PROPIETARIA',
    registradoPor: 'owner',
    revisadoPor: null,
    fechaRevision: null,
    motivoRechazo: null,
    motivoAnulacion: null,
  };
}
