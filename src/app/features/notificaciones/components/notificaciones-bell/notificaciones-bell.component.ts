import { DOCUMENT, DatePipe, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import {
  EMPTY,
  Subscription,
  catchError,
  distinctUntilChanged,
  filter,
  finalize,
  from,
  fromEvent,
  map,
  merge,
  of,
  switchMap,
  tap,
  throttleTime,
  timer,
} from 'rxjs';

import { AuthService } from '../../../../core/auth/auth.service';
import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { NotificacionRealtimeService } from '../../data/notificacion-realtime.service';
import { PagoApiService } from '../../../contratos/data/pago-api.service';
import { NotificacionesApiService } from '../../data/notificaciones-api.service';
import { NotificacionResponse } from '../../models/notificacion.model';

const CUOTA_NOTIFICATION_TYPES = new Set(['CUOTA_PROXIMA_VENCER', 'CUOTA_VENCIDA']);
const PAGO_NOTIFICATION_TYPES = new Set([
  'COMPROBANTE_RECIBIDO',
  'PAGO_CONFIRMADO',
  'PAGO_RECHAZADO',
]);

@Component({
  selector: 'app-notificaciones-bell',
  imports: [DatePipe, MatIconModule, NgTemplateOutlet],
  templateUrl: './notificaciones-bell.component.html',
  styleUrl: './notificaciones-bell.component.css',
})
export class NotificacionesBellComponent {
  private readonly auth = inject(AuthService);
  private readonly api = inject(NotificacionesApiService);
  private readonly realtime = inject(NotificacionRealtimeService);
  private readonly pagoApi = inject(PagoApiService);
  private readonly router = inject(Router);
  private readonly notification = inject(OrmanNotificationService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');
  private readonly triggerButton = viewChild<ElementRef<HTMLButtonElement>>('triggerButton');

  readonly opened = output<void>();

  protected readonly isPanelOpen = signal(false);
  protected readonly unreadCount = signal(0);
  protected readonly unreadBadge = computed(() => {
    const count = this.unreadCount();

    if (count === 0) {
      return null;
    }

    return count > 9 ? '9+' : String(count);
  });
  protected readonly triggerLabel = computed(() => {
    const count = this.unreadCount();

    return count > 0 ? `${count} notificaciones sin leer` : 'Notificaciones';
  });
  protected readonly notifications = signal<readonly NotificacionResponse[]>([]);
  protected readonly isListLoading = signal(false);
  protected readonly listError = signal(false);
  protected readonly openingIds = signal<ReadonlySet<number>>(new Set());

  private listRequest: Subscription | null = null;
  private summaryRefreshRequest: Subscription | null = null;
  private pendingRealtimeRefresh = false;

  constructor() {
    effect(() => {
      if (this.isPanelOpen()) {
        this.closeButton()?.nativeElement.focus();
      }
    });

    effect((onCleanup) => {
      if (!this.auth.authenticated()) {
        return;
      }

      const visibilityChanges$ = merge(
        of(this.document.visibilityState !== 'hidden'),
        fromEvent(this.document, 'visibilitychange').pipe(
          map(() => this.document.visibilityState !== 'hidden'),
        ),
      ).pipe(distinctUntilChanged());

      const visiblePolling$ = visibilityChanges$.pipe(
        switchMap((isVisible) => (isVisible ? merge(of(undefined), timer(30_000, 30_000)) : EMPTY)),
      );

      const focusTarget = this.document.defaultView;
      const focusRefresh$ = focusTarget
        ? fromEvent(focusTarget, 'focus').pipe(
            filter(() => this.document.visibilityState !== 'hidden'),
            throttleTime(1_000),
          )
        : EMPTY;

      const pollingSubscription = merge(visiblePolling$, focusRefresh$).subscribe(() => {
        this.requestSummaryRefresh(false);
      });
      const realtimeSubscription = merge(this.realtime.events$, this.realtime.connected$).subscribe(
        () => this.requestSummaryRefresh(true),
      );

      onCleanup(() => {
        pollingSubscription.unsubscribe();
        realtimeSubscription.unsubscribe();
        this.pendingRealtimeRefresh = false;
        this.summaryRefreshRequest?.unsubscribe();
        this.summaryRefreshRequest = null;
      });
    });

    effect((onCleanup) => {
      this.realtime.syncWithSession(this.auth.accessToken());

      onCleanup(() => this.realtime.disconnect());
    });
  }

  protected togglePanel(): void {
    if (this.isPanelOpen()) {
      this.closePanel();
      return;
    }

    this.isPanelOpen.set(true);
    this.opened.emit();
    this.loadNotifications();
  }

  protected closePanel(restoreFocus = true): void {
    if (!this.isPanelOpen()) {
      return;
    }

    this.isPanelOpen.set(false);
    this.listRequest?.unsubscribe();
    this.listRequest = null;

    if (restoreFocus) {
      queueMicrotask(() => this.triggerButton()?.nativeElement.focus());
    }
  }

  protected retryList(): void {
    this.loadNotifications();
  }

  protected canOpenNotification(notification: NotificacionResponse): boolean {
    const hasValidReferenceId = this.isValidId(notification.referenciaId);

    return (
      hasValidReferenceId &&
      ((notification.referenciaTipo === 'CUOTA' &&
        CUOTA_NOTIFICATION_TYPES.has(notification.tipo)) ||
        (notification.referenciaTipo === 'PAGO' && PAGO_NOTIFICATION_TYPES.has(notification.tipo)))
    );
  }

  protected openNotification(notification: NotificacionResponse): void {
    if (!this.canOpenNotification(notification) || this.openingIds().has(notification.codnot)) {
      return;
    }

    let navigationSucceeded = false;
    this.updateOpeningId(notification.codnot, true);

    this.markNotificationAsRead(notification)
      .pipe(
        tap(() => this.closePanel(false)),
        switchMap(() => this.resolveQuotaId(notification)),
        switchMap((codcuo) =>
          from(
            this.router.navigate(['/app/pagos/listar'], {
              queryParams: { codcuo },
            }),
          ),
        ),
        tap((navigated) => {
          navigationSucceeded = navigated;

          if (!navigated) {
            this.notification.error('No se pudo abrir la cuota relacionada.');
          }
        }),
        catchError(() => {
          this.notification.error('No se pudo abrir la cuota relacionada.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.updateOpeningId(notification.codnot, false);

          if (!navigationSucceeded) {
            queueMicrotask(() => this.triggerButton()?.nativeElement.focus());
          }
        }),
      )
      .subscribe();
  }

  protected isOpening(codnot: number): boolean {
    return this.openingIds().has(codnot);
  }

  @HostListener('document:pointerdown', ['$event'])
  protected handleDocumentPointerdown(event: PointerEvent): void {
    if (
      this.isPanelOpen() &&
      event.target instanceof Node &&
      !this.hostElement.nativeElement.contains(event.target)
    ) {
      this.closePanel(false);
    }
  }

  @HostListener('document:keydown', ['$event'])
  protected handleDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isPanelOpen()) {
      event.preventDefault();
      this.closePanel();
    }
  }

  private loadNotifications(): void {
    this.listRequest?.unsubscribe();
    this.listError.set(false);
    this.isListLoading.set(true);

    this.listRequest = this.api
      .list(0, 20)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isListLoading.set(false);
          this.listRequest = null;
        }),
      )
      .subscribe({
        next: (page) => this.notifications.set(page.content),
        error: () => this.listError.set(true),
      });
  }

  private requestSummaryRefresh(isRealtime: boolean): void {
    if (this.summaryRefreshRequest) {
      if (isRealtime) {
        this.pendingRealtimeRefresh = true;
      }

      return;
    }

    const refreshList = isRealtime && this.isPanelOpen();

    if (refreshList) {
      this.listRequest?.unsubscribe();
      this.listRequest = null;
    }

    this.summaryRefreshRequest = this.api
      .getSummary()
      .pipe(
        tap((summary) => this.unreadCount.set(summary.noLeidas)),
        switchMap(() => {
          if (!refreshList || !this.isPanelOpen()) {
            return EMPTY;
          }

          return this.api.list(0, 20).pipe(
            tap((page) => {
              this.notifications.set(page.content);
              this.listError.set(false);
            }),
            catchError(() => EMPTY),
          );
        }),
        catchError(() => EMPTY),
        finalize(() => {
          this.summaryRefreshRequest = null;

          if (this.pendingRealtimeRefresh) {
            this.pendingRealtimeRefresh = false;
            this.requestSummaryRefresh(true);
          }
        }),
      )
      .subscribe();
  }

  private markNotificationAsRead(notification: NotificacionResponse) {
    if (notification.leida) {
      return of(undefined);
    }

    return this.api.markAsRead(notification.codnot).pipe(
      tap((updatedNotification) => {
        this.notifications.update((current) =>
          current.map((item) =>
            item.codnot === updatedNotification.codnot ? updatedNotification : item,
          ),
        );

        if (updatedNotification.leida) {
          this.unreadCount.update((count) => Math.max(0, count - 1));
        }
      }),
      map(() => undefined),
      catchError(() => {
        this.notification.error('No se pudo marcar como leída. Se abrirá la referencia.');
        return of(undefined);
      }),
    );
  }

  private resolveQuotaId(notification: NotificacionResponse) {
    if (notification.referenciaTipo === 'CUOTA') {
      return of(notification.referenciaId);
    }

    return this.pagoApi.getById(notification.referenciaId).pipe(
      map((payment) => payment.codcuo),
      catchError(() => {
        this.notification.error('No se pudo abrir el pago relacionado.');
        return EMPTY;
      }),
    );
  }

  private isValidId(id: number): boolean {
    return Number.isSafeInteger(id) && id > 0;
  }

  private updateOpeningId(codnot: number, isOpening: boolean): void {
    this.openingIds.update((current) => {
      const next = new Set(current);

      if (isOpening) {
        next.add(codnot);
      } else {
        next.delete(codnot);
      }

      return next;
    });
  }
}
