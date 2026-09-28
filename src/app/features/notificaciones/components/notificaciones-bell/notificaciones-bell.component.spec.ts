import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';
import { authInterceptor } from '../../../../core/auth/auth.interceptor';
import { NotificacionResponse, NotificacionesPageResponse } from '../../models/notificacion.model';
import { NotificacionesBellComponent } from './notificaciones-bell.component';

describe('NotificacionesBellComponent', () => {
  let fixture: ComponentFixture<NotificacionesBellComponent>;
  let auth: AuthService;
  let http: HttpTestingController;
  let originalVisibilityDescriptor: PropertyDescriptor | undefined;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificacionesBellComponent],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    originalVisibilityDescriptor = Object.getOwnPropertyDescriptor(document, 'visibilityState');
    fixture = TestBed.createComponent(NotificacionesBellComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    auth.clearSession();
    http.verify();
    vi.useRealTimers();
    vi.restoreAllMocks();
    if (originalVisibilityDescriptor) {
      Object.defineProperty(document, 'visibilityState', originalVisibilityDescriptor);
    } else {
      Reflect.deleteProperty(document, 'visibilityState');
    }
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

    const summaryRequest = http.expectOne('/api/v1/notificaciones/resumen');
    expect(summaryRequest.request.headers.get('Authorization')).toBe('Bearer access-token');
    summaryRequest.flush({ noLeidas: unreadCount });
    fixture.detectChanges();
  }

  function openPanel(): void {
    const trigger = fixture.nativeElement.querySelector(
      '[aria-haspopup="dialog"]',
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
  }

  function expectListRequest(): ReturnType<HttpTestingController['expectOne']> {
    return http.expectOne(
      (request) =>
        request.url === '/api/v1/notificaciones' &&
        request.params.get('page') === '0' &&
        request.params.get('size') === '20',
    );
  }

  function createNotification(overrides: Partial<NotificacionResponse> = {}): NotificacionResponse {
    return {
      codnot: 41,
      tipo: 'COMPROBANTE_RECIBIDO',
      titulo: 'Comprobante recibido',
      mensaje: 'Se registró un comprobante para la cuota 3044.',
      referenciaTipo: 'PAGO',
      referenciaId: 3044,
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

  it('does not show a numeric badge when there are no unread notifications', () => {
    authenticate(0);

    const trigger = fixture.nativeElement.querySelector(
      '[aria-label="Notificaciones"]',
    ) as HTMLButtonElement;

    expect(trigger).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.notification-count-badge')).toBeNull();
  });

  it('shows the exact unread count and an accessible label', () => {
    authenticate(3);

    const trigger = fixture.nativeElement.querySelector(
      '[aria-label="3 notificaciones sin leer"]',
    ) as HTMLButtonElement;

    expect(trigger).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('.notification-count-badge')?.textContent?.trim(),
    ).toBe('3');
  });

  it('caps the visible badge at 9+ while preserving the accessible count', () => {
    authenticate(15);

    const trigger = fixture.nativeElement.querySelector(
      '[aria-label="15 notificaciones sin leer"]',
    ) as HTMLButtonElement;

    expect(trigger).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('.notification-count-badge')?.textContent?.trim(),
    ).toBe('9+');
  });

  it('loads the first page and shows the empty state', () => {
    authenticate(0);
    openPanel();

    const request = expectListRequest();
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-token');
    request.flush(createPage([]));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No tienes notificaciones.');
  });

  it('shows a discreet loading state while the list request is pending', () => {
    authenticate(0);
    openPanel();

    expect(fixture.nativeElement.textContent).toContain('Cargando notificaciones…');
    expect(fixture.nativeElement.querySelector('[aria-haspopup="dialog"]')).toBeTruthy();

    expectListRequest().flush(createPage([]));
    fixture.detectChanges();
  });

  it('shows new notifications with multiple unread signals and read notifications as secondary', () => {
    authenticate(1);
    openPanel();

    const notificationTypes = [
      'CUOTA_PROXIMA_VENCER',
      'CUOTA_VENCIDA',
      'COMPROBANTE_RECIBIDO',
      'PAGO_CONFIRMADO',
      'PAGO_RECHAZADO',
    ];
    const notificationList = notificationTypes.map((tipo, index) =>
      createNotification({
        codnot: 41 + index,
        tipo,
        titulo: `Notificación ${index + 1}`,
        mensaje: `Mensaje de prueba para ${tipo}.`,
        referenciaTipo:
          tipo === 'CUOTA_PROXIMA_VENCER' || tipo === 'CUOTA_VENCIDA' ? 'CUOTA' : 'PAGO',
        referenciaId: 700 + index,
        leida: index > 0 && index !== 2,
        fechaLectura: index > 0 && index !== 2 ? '2026-09-26T11:00:00' : null,
      }),
    );

    expectListRequest().flush(createPage(notificationList));
    fixture.detectChanges();

    const renderedTypes = [...fixture.nativeElement.querySelectorAll('li')].map(
      (element: Element) => element.querySelector('.uppercase')?.textContent?.trim(),
    );
    const unreadButton = fixture.nativeElement.querySelector(
      'button[aria-label^="Abrir notificación"]',
    ) as HTMLButtonElement;
    const receiptNotificationButton = [
      ...fixture.nativeElement.querySelectorAll('button[aria-label^="Abrir notificación"]'),
    ].find((button: HTMLButtonElement) =>
      button.textContent?.includes('COMPROBANTE_RECIBIDO'),
    ) as HTMLButtonElement;
    const readItem = fixture.nativeElement.querySelector(
      'button[aria-label="Abrir notificación: Notificación 2"]',
    ) as HTMLElement;

    expect(renderedTypes).toEqual(notificationTypes);
    expect(unreadButton.textContent).toContain('CUOTA_PROXIMA_VENCER');
    expect(unreadButton.textContent).toContain('Nueva');
    expect(unreadButton.querySelector('.font-semibold')).toBeTruthy();
    expect(unreadButton.textContent).toContain('Mensaje de prueba para CUOTA_PROXIMA_VENCER.');
    expect(receiptNotificationButton.textContent).toContain('Nueva');
    expect(receiptNotificationButton.querySelector('.size-2.rounded-full.bg-accent')).toBeTruthy();
    expect(receiptNotificationButton.getAttribute('aria-label')).toContain('Abrir notificación');
    expect(readItem.textContent).toContain('Leída');
    expect(readItem.classList).toContain('text-muted');
  });

  it('shows a retry action when the list fails and recovers after retry', () => {
    authenticate(0);
    openPanel();
    expectListRequest().flush(
      { detail: 'Internal Server Error' },
      { status: 500, statusText: 'Server Error' },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No se pudieron cargar las notificaciones.',
    );
    const panel = fixture.nativeElement.querySelector(
      '#private-notifications-panel',
    ) as HTMLElement;
    const retry = [...panel.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Reintentar'),
    ) as HTMLButtonElement;
    expect(retry.textContent).toContain('Reintentar');
    retry.click();
    fixture.detectChanges();

    expectListRequest().flush(createPage([]));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No tienes notificaciones.');
    expect(fixture.nativeElement.textContent).not.toContain(
      'No se pudieron cargar las notificaciones.',
    );
  });

  it('closes with Escape and returns focus to the bell', async () => {
    authenticate(0);
    openPanel();
    expectListRequest().flush(createPage([]));
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector(
      '[aria-haspopup="dialog"]',
    ) as HTMLButtonElement;
    const closeButton = fixture.nativeElement.querySelector(
      '[aria-label="Cerrar notificaciones"]',
    ) as HTMLButtonElement;
    expect(document.activeElement).toBe(closeButton);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await Promise.resolve();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes when the user clicks outside the panel', () => {
    authenticate(0);
    openPanel();
    expectListRequest().flush(createPage([]));
    fixture.detectChanges();

    document.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('refreshes the summary every 30 seconds while the document is visible', async () => {
    vi.useFakeTimers();
    authenticate(1);

    await vi.advanceTimersByTimeAsync(29_999);
    http.expectNone('/api/v1/notificaciones/resumen');

    await vi.advanceTimersByTimeAsync(1);
    http.expectOne('/api/v1/notificaciones/resumen').flush({ noLeidas: 2 });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.notification-count-badge')?.textContent?.trim(),
    ).toBe('2');
  });

  it('pauses summary polling while hidden and refreshes when visible again', async () => {
    vi.useFakeTimers();
    authenticate(1);
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));

    await vi.advanceTimersByTimeAsync(60_000);
    http.expectNone('/api/v1/notificaciones/resumen');

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
    http.expectOne('/api/v1/notificaciones/resumen').flush({ noLeidas: 2 });
    fixture.detectChanges();
  });

  it('cancels polling after logout and component destruction', async () => {
    vi.useFakeTimers();
    authenticate(1);

    auth.logout().subscribe();
    http.expectOne('/api/v1/auth/logout').flush(null);
    fixture.detectChanges();
    expect(auth.authenticated()).toBe(false);

    await vi.advanceTimersByTimeAsync(60_000);
    http.expectNone('/api/v1/notificaciones/resumen');

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
    http.expectOne('/api/v1/notificaciones/resumen').flush({ noLeidas: 2 });
    fixture.detectChanges();
    fixture.destroy();

    await vi.advanceTimersByTimeAsync(60_000);
    http.expectNone('/api/v1/notificaciones/resumen');
  });
});
