import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth.service';
import { authInterceptor } from '../../../../core/auth/auth.interceptor';
import { ThemeService } from '../../../../core/theme/theme.service';
import {
  NotificacionRealtimeEvent,
  NotificacionRealtimeService,
} from '../../data/notificacion-realtime.service';
import { NotificacionResponse, NotificacionesPageResponse } from '../../models/notificacion.model';
import { NotificacionesBellComponent } from './notificaciones-bell.component';

describe('NotificacionesBellComponent', () => {
  let fixture: ComponentFixture<NotificacionesBellComponent>;
  let auth: AuthService;
  let http: HttpTestingController;
  let originalVisibilityDescriptor: PropertyDescriptor | undefined;
  let realtime: {
    events$: Subject<NotificacionRealtimeEvent>;
    connected$: Subject<void>;
    syncWithSession: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    realtime = {
      events$: new Subject<NotificacionRealtimeEvent>(),
      connected$: new Subject<void>(),
      syncWithSession: vi.fn(),
      disconnect: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [NotificacionesBellComponent],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: NotificacionRealtimeService, useValue: realtime },
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

  function expectListRequest(page = 0): ReturnType<HttpTestingController['expectOne']> {
    return http.expectOne(
      (request) =>
        request.url === '/api/v1/notificaciones' &&
        request.params.get('page') === String(page) &&
        request.params.get('size') === '4',
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

  function createPage(
    content: readonly NotificacionResponse[],
    page = 0,
    totalPages = content.length > 0 ? 1 : 0,
  ): NotificacionesPageResponse {
    return {
      content,
      page,
      size: 4,
      totalElements:
        totalPages === 0 ? 0 : totalPages === 1 ? content.length : (totalPages - 1) * 4 + 1,
      totalPages,
      first: page === 0,
      last: totalPages === 0 || page === totalPages - 1,
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

  it('starts the realtime session after login and after session restoration', () => {
    authenticate(0);
    expect(realtime.syncWithSession).toHaveBeenCalledWith('access-token');

    auth.logout().subscribe();
    http.expectOne('/api/v1/auth/logout').flush(null);
    fixture.detectChanges();
    realtime.syncWithSession.mockClear();

    auth.restoreSession().subscribe();
    http.expectOne('/api/v1/auth/refresh').flush({
      status: 'AUTHENTICATED',
      login: 'propietaria',
      codper: 10,
      accessToken: 'restored-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      sid: 'restored-session',
    });
    fixture.detectChanges();
    http.expectOne('/api/v1/notificaciones/resumen').flush({ noLeidas: 0 });

    expect(realtime.syncWithSession).toHaveBeenCalledWith('restored-token');
  });

  it('reconnects the badge through REST after STOMP reports a connection', () => {
    authenticate(0);

    realtime.connected$.next();
    http.expectOne('/api/v1/notificaciones/resumen').flush({ noLeidas: 1 });
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.notification-count-badge')?.textContent?.trim(),
    ).toBe('1');
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

  it('pages through four notifications, replaces the list, and disables controls at the ends', () => {
    authenticate(7);
    openPanel();

    const firstPageNotifications = Array.from({ length: 4 }, (_, index) =>
      createNotification({
        codnot: 100 + index,
        titulo: `Aviso página uno ${index + 1}`,
      }),
    );
    expectListRequest(0).flush(createPage(firstPageNotifications, 0, 2));
    fixture.detectChanges();

    const previousButton = fixture.nativeElement.querySelector(
      '.notification-previous-button',
    ) as HTMLButtonElement;
    const nextButton = fixture.nativeElement.querySelector(
      '.notification-next-button',
    ) as HTMLButtonElement;
    expect(previousButton.disabled).toBe(true);
    expect(nextButton.disabled).toBe(false);
    expect(
      fixture.nativeElement.querySelector('.notification-page-indicator')?.textContent?.trim(),
    ).toBe('1 / 2');
    expect(fixture.nativeElement.querySelectorAll('.notification-item').length).toBe(4);
    expect(
      [...fixture.nativeElement.querySelectorAll('.notification-title')].map((title: Element) =>
        title.textContent?.trim(),
      ),
    ).toEqual([
      'Aviso página uno 1',
      'Aviso página uno 2',
      'Aviso página uno 3',
      'Aviso página uno 4',
    ]);

    nextButton.click();
    fixture.detectChanges();
    expect(nextButton.disabled).toBe(true);

    const secondPageNotification = createNotification({
      codnot: 104,
      titulo: 'Aviso página dos',
    });
    expectListRequest(1).flush(createPage([secondPageNotification], 1, 2));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Aviso página dos');
    expect(fixture.nativeElement.textContent).not.toContain('Aviso página uno');
    expect(fixture.nativeElement.querySelectorAll('.notification-item').length).toBe(1);
    expect(
      fixture.nativeElement.querySelector('.notification-page-indicator')?.textContent?.trim(),
    ).toBe('2 / 2');
    expect(previousButton.disabled).toBe(false);
    expect(nextButton.disabled).toBe(true);
    expect(
      fixture.nativeElement.querySelector('.notification-count-badge')?.textContent?.trim(),
    ).toBe('7');

    previousButton.click();
    fixture.detectChanges();
    expectListRequest(0).flush(createPage(firstPageNotifications, 0, 2));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aviso página uno 1');
    expect(fixture.nativeElement.textContent).not.toContain('Aviso página dos');
  });

  it('does not show a page number when the API reports no pages', () => {
    authenticate(0);
    openPanel();
    expectListRequest().flush(createPage([]));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.notification-page-indicator')).toBeNull();
    expect(
      (fixture.nativeElement.querySelector('.notification-previous-button') as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (fixture.nativeElement.querySelector('.notification-next-button') as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('refreshes the badge through REST when a STOMP event arrives', () => {
    authenticate(1);

    realtime.events$.next({ codnot: 73, tipo: 'COMPROBANTE_RECIBIDO' });
    http.expectOne('/api/v1/notificaciones/resumen').flush({ noLeidas: 2 });
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.notification-count-badge')?.textContent?.trim(),
    ).toBe('2');
  });

  it('refreshes the open notification list from REST after a STOMP event', () => {
    authenticate(0);
    openPanel();
    expectListRequest().flush(createPage([]));

    realtime.events$.next({ codnot: 73, tipo: 'COMPROBANTE_RECIBIDO' });
    http.expectOne('/api/v1/notificaciones/resumen').flush({ noLeidas: 1 });
    expectListRequest().flush(createPage([createNotification()]));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Comprobante recibido');
  });

  it('refreshes the active page after STOMP without changing the global unread count', () => {
    authenticate(6);
    openPanel();
    expectListRequest(0).flush(
      createPage(
        Array.from({ length: 4 }, (_, index) =>
          createNotification({ codnot: 200 + index, titulo: `Primera ${index + 1}` }),
        ),
        0,
        2,
      ),
    );
    fixture.detectChanges();

    const nextButton = fixture.nativeElement.querySelector(
      '.notification-next-button',
    ) as HTMLButtonElement;
    nextButton.click();
    fixture.detectChanges();
    expectListRequest(1).flush(
      createPage([createNotification({ codnot: 204, titulo: 'Segunda antes del evento' })], 1, 2),
    );
    fixture.detectChanges();

    realtime.events$.next({ codnot: 300, tipo: 'COMPROBANTE_RECIBIDO' });
    http.expectOne('/api/v1/notificaciones/resumen').flush({ noLeidas: 7 });
    expectListRequest(1).flush(
      createPage([createNotification({ codnot: 301, titulo: 'Segunda después del evento' })], 1, 2),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Segunda después del evento');
    expect(fixture.nativeElement.textContent).not.toContain('Primera 1');
    expect(
      fixture.nativeElement.querySelector('.notification-page-indicator')?.textContent?.trim(),
    ).toBe('2 / 2');
    expect(
      fixture.nativeElement.querySelector('.notification-count-badge')?.textContent?.trim(),
    ).toBe('7');
  });

  it('retries a failed page request at that page and replaces the old content on success', () => {
    authenticate(0);
    openPanel();
    const firstPage = Array.from({ length: 4 }, (_, index) =>
      createNotification({ codnot: 400 + index, titulo: `Página uno ${index + 1}` }),
    );
    expectListRequest(0).flush(createPage(firstPage, 0, 2));
    fixture.detectChanges();

    const nextButton = fixture.nativeElement.querySelector(
      '.notification-next-button',
    ) as HTMLButtonElement;
    nextButton.click();
    fixture.detectChanges();
    expectListRequest(1).flush(
      { detail: 'Service Unavailable' },
      { status: 503, statusText: 'Service Unavailable' },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No se pudieron cargar las notificaciones.',
    );
    expect(fixture.nativeElement.textContent).toContain('Página uno 1');
    const retryButton = fixture.nativeElement.querySelector(
      '.notification-retry-button',
    ) as HTMLButtonElement;
    retryButton.click();
    fixture.detectChanges();

    expectListRequest(1).flush(
      createPage([createNotification({ codnot: 404, titulo: 'Página dos recuperada' })], 1, 2),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Página dos recuperada');
    expect(fixture.nativeElement.textContent).not.toContain('Página uno 1');
    expect(fixture.nativeElement.textContent).not.toContain(
      'No se pudieron cargar las notificaciones.',
    );
  });

  it('shows a discreet loading state while the list request is pending', () => {
    authenticate(0);
    openPanel();

    expect(fixture.nativeElement.textContent).toContain('Cargando notificaciones…');
    expect(fixture.nativeElement.querySelector('[aria-haspopup="dialog"]')).toBeTruthy();

    expectListRequest().flush(createPage([]));
    fixture.detectChanges();
  });

  it('renders localized categories, matching icons, and the response read state', () => {
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
        titulo:
          tipo === 'COMPROBANTE_RECIBIDO' ? 'Comprobante recibido' : `Notificación ${index + 1}`,
        mensaje:
          tipo === 'COMPROBANTE_RECIBIDO'
            ? 'Juan Pérez presentó un comprobante de Bs 75,00 correspondiente a septiembre de 2026.'
            : `Mensaje de prueba para ${tipo}.`,
        referenciaTipo:
          tipo === 'CUOTA_PROXIMA_VENCER' || tipo === 'CUOTA_VENCIDA' ? 'CUOTA' : 'PAGO',
        referenciaId: 700 + index,
        leida: index > 0 && index !== 2,
        fechaLectura: index > 0 && index !== 2 ? '2026-09-26T11:00:00' : null,
      }),
    );

    expectListRequest(0).flush(createPage(notificationList.slice(0, 4), 0, 2));
    fixture.detectChanges();

    const renderedCategories = [
      ...fixture.nativeElement.querySelectorAll('.notification-category'),
    ].map((element: Element) => element.textContent?.trim());
    const renderedIcons = [...fixture.nativeElement.querySelectorAll('.notification-icon')].map(
      (element: Element) => element.textContent?.trim(),
    );
    const unreadButton = fixture.nativeElement.querySelector(
      'button[aria-label^="Abrir notificación no leída"]',
    ) as HTMLButtonElement;
    const receiptNotificationButton = [
      ...fixture.nativeElement.querySelectorAll('button[aria-label^="Abrir notificación"]'),
    ].find((button: HTMLButtonElement) =>
      button.textContent?.includes('Comprobante recibido'),
    ) as HTMLButtonElement;
    const readItem = [
      ...fixture.nativeElement.querySelectorAll('button[aria-label^="Abrir notificación leída"]'),
    ].find((button: HTMLButtonElement) =>
      button.getAttribute('aria-label')?.includes('Pago confirmado'),
    ) as HTMLElement;

    expect(notificationList.map((item) => item.tipo)).toEqual(notificationTypes);
    expect(renderedCategories).toEqual([
      'Cuota próxima a vencer',
      'Cuota vencida',
      'Pagos',
      'Pago confirmado',
    ]);
    expect(renderedIcons).toEqual(['event_upcoming', 'event_busy', 'receipt_long', 'task_alt']);
    expect(unreadButton.textContent).toContain('No leída');
    expect(unreadButton.textContent).not.toContain('Nueva');
    expect(unreadButton.querySelector('.notification-title--unread')).toBeTruthy();
    expect(unreadButton.textContent).toContain('Mensaje de prueba para CUOTA_PROXIMA_VENCER.');
    expect(receiptNotificationButton.textContent).toContain('No leída');
    expect(
      receiptNotificationButton.querySelector('.notification-title')?.textContent?.trim(),
    ).toBe('Comprobante recibido');
    expect(
      receiptNotificationButton.querySelector('.notification-message')?.textContent?.trim(),
    ).toBe('Juan Pérez presentó un comprobante de Bs 75,00 correspondiente a septiembre de 2026.');
    expect(
      receiptNotificationButton.querySelector('.notification-read-status--unread'),
    ).toBeTruthy();
    expect(receiptNotificationButton.getAttribute('aria-label')).toContain('no leída');
    expect(readItem.textContent).toContain('Leída');
    expect(readItem.classList).toContain('notification-item--read');

    const nextButton = fixture.nativeElement.querySelector(
      '.notification-next-button',
    ) as HTMLButtonElement;
    nextButton.click();
    fixture.detectChanges();
    expectListRequest(1).flush(createPage(notificationList.slice(4), 1, 2));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.notification-category')?.textContent?.trim()).toBe(
      'Pago rechazado',
    );
    expect(fixture.nativeElement.querySelector('.notification-icon')?.textContent?.trim()).toBe(
      'cancel',
    );
  });

  it.each([
    {
      leida: false,
      visibleState: 'No leída',
      accessibleState: 'no leída',
      itemStateClass: 'notification-item--unread',
    },
    {
      leida: true,
      visibleState: 'Leída',
      accessibleState: 'leída',
      itemStateClass: 'notification-item--read',
    },
  ])(
    'uses the real leida value for a notification without a navigation action',
    ({ leida, visibleState, accessibleState, itemStateClass }) => {
      authenticate(leida ? 0 : 1);
      openPanel();

      expectListRequest().flush(
        createPage([
          createNotification({
            tipo: 'AVISO_FUTURO',
            referenciaTipo: 'OTRO',
            leida,
          }),
        ]),
      );
      fixture.detectChanges();

      const staticNotification = fixture.nativeElement.querySelector(
        'article.notification-item',
      ) as HTMLElement;

      expect(staticNotification.textContent).toContain(visibleState);
      expect(staticNotification.getAttribute('aria-label')).toContain(accessibleState);
      expect(staticNotification.classList).toContain(itemStateClass);
      expect(staticNotification.querySelector('button')).toBeNull();
      expect(staticNotification.textContent).not.toContain('Nueva');
      http.expectNone('/api/v1/notificaciones/41/leer');
    },
  );

  it('updates the active theme attribute while keeping the panel open', () => {
    const themeService = TestBed.inject(ThemeService);
    authenticate(0);
    openPanel();
    expectListRequest().flush(createPage([createNotification()]));
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector(
      '#private-notifications-panel',
    ) as HTMLElement;

    themeService.setTheme('light');
    fixture.detectChanges();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(fixture.nativeElement.querySelector('#private-notifications-panel')).toBe(panel);
    expect(panel.classList).toContain('bg-card');

    themeService.setTheme('dark');
    fixture.detectChanges();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(fixture.nativeElement.querySelector('#private-notifications-panel')).toBe(panel);

    themeService.setTheme('orman');
    fixture.detectChanges();
    expect(document.documentElement.getAttribute('data-theme')).toBe('orman');
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

  it('queues a realtime refresh behind an active poll without overlapping REST requests', async () => {
    vi.useFakeTimers();
    authenticate(1);

    await vi.advanceTimersByTimeAsync(30_000);
    const pollingRequest = http.expectOne('/api/v1/notificaciones/resumen');

    realtime.events$.next({ codnot: 73, tipo: 'COMPROBANTE_RECIBIDO' });
    expect(http.match('/api/v1/notificaciones/resumen')).toHaveLength(0);

    pollingRequest.flush({ noLeidas: 1 });
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
