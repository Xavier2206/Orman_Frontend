import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';

import { isProblemDetail } from '../../../../core/api/problem-detail.model';
import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { QrCobroCurrentComponent } from '../../components/qr-cobro-current/qr-cobro-current.component';
import { QrCobroHistoryComponent } from '../../components/qr-cobro-history/qr-cobro-history.component';
import { QrCobroConfigModalComponent } from '../../components/qr-cobro-config-modal/qr-cobro-config-modal.component';
import { QrCobroApiService } from '../../data/qr-cobro-api.service';
import { QrCobroResponse } from '../../models/qr-cobro.model';

@Component({
  selector: 'app-qr-cobro',
  imports: [
    MatIconModule,
    QrCobroCurrentComponent,
    QrCobroHistoryComponent,
    QrCobroConfigModalComponent,
  ],
  templateUrl: './qr-cobro.component.html',
  styleUrl: './qr-cobro.component.css',
})
export class QrCobroComponent implements OnInit, OnDestroy {
  private readonly qrApi = inject(QrCobroApiService);
  private readonly notification = inject(OrmanNotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private currentRequestId = 0;
  private historyRequestId = 0;
  private imageRequestId = 0;
  private currentImageUrl: string | null = null;

  protected readonly currentQr = signal<QrCobroResponse | null>(null);
  protected readonly history = signal<readonly QrCobroResponse[]>([]);
  protected readonly currentLoading = signal(true);
  protected readonly historyLoading = signal(true);
  protected readonly imageLoading = signal(false);
  protected readonly currentError = signal<string | null>(null);
  protected readonly historyError = signal<string | null>(null);
  protected readonly imageError = signal<string | null>(null);
  protected readonly imageUrl = signal<string | null>(null);
  protected readonly configModalOpen = signal(false);

  ngOnInit(): void {
    this.refresh();
  }

  ngOnDestroy(): void {
    this.clearImageUrl();
  }

  protected refresh(): void {
    this.loadCurrentQr();
    this.loadHistory();
  }

  protected retryCurrent(): void {
    this.loadCurrentQr();
  }

  protected retryHistory(): void {
    this.loadHistory();
  }

  protected retryImage(): void {
    const current = this.currentQr();

    if (current?.tieneImagen) {
      this.loadImage(current.codqr);
    }
  }

  protected openConfigModal(): void {
    this.configModalOpen.set(true);
  }

  protected closeConfigModal(): void {
    this.configModalOpen.set(false);
  }

  protected handleSaved(): void {
    this.configModalOpen.set(false);
    this.notification.success('QR de cobro configurado correctamente.');
    this.refresh();
  }

  protected handleRecoveryFailed(): void {
    this.loadCurrentQr();
    this.loadHistory();
  }

  protected handleImageError(): void {
    this.imageError.set('No fue posible cargar la imagen del QR.');
    this.clearImageUrl();
  }

  private loadCurrentQr(): void {
    const requestId = ++this.currentRequestId;
    this.currentLoading.set(true);
    this.currentError.set(null);

    this.qrApi
      .getCurrent()
      .pipe(
        finalize(() => {
          if (requestId === this.currentRequestId) {
            this.currentLoading.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (current) => {
          if (requestId !== this.currentRequestId) {
            return;
          }

          const previousCode = this.currentQr()?.codqr;
          this.currentQr.set(current);
          this.imageError.set(null);

          if (previousCode !== current.codqr) {
            this.clearImageUrl();
          }

          if (current.tieneImagen) {
            this.loadImage(current.codqr);
            return;
          }

          this.clearImageUrl();
          this.imageError.set('Este QR no tiene una imagen asociada.');
        },
        error: (error: unknown) => {
          if (requestId !== this.currentRequestId) {
            return;
          }

          if (error instanceof HttpErrorResponse && error.status === 404) {
            this.currentQr.set(null);
            this.imageError.set(null);
            this.clearImageUrl();
            return;
          }

          this.currentQr.set(null);
          this.imageError.set(null);
          this.clearImageUrl();
          this.currentError.set(this.loadErrorMessage(error, 'el QR vigente'));
        },
      });
  }

  private loadHistory(): void {
    const requestId = ++this.historyRequestId;
    this.historyLoading.set(true);
    this.historyError.set(null);

    this.qrApi
      .list()
      .pipe(
        finalize(() => {
          if (requestId === this.historyRequestId) {
            this.historyLoading.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (history) => {
          if (requestId === this.historyRequestId) {
            this.history.set(history);
          }
        },
        error: (error: unknown) => {
          if (requestId === this.historyRequestId) {
            this.historyError.set(this.loadErrorMessage(error, 'el historial de QR'));
          }
        },
      });
  }

  private loadImage(codqr: number): void {
    const requestId = ++this.imageRequestId;
    this.imageLoading.set(true);
    this.imageError.set(null);

    this.qrApi
      .getImage(codqr)
      .pipe(
        finalize(() => {
          if (requestId === this.imageRequestId) {
            this.imageLoading.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (image) => {
          if (requestId !== this.imageRequestId) {
            return;
          }

          try {
            this.replaceImageUrl(URL.createObjectURL(image));
          } catch {
            this.imageError.set('No fue posible cargar la imagen del QR.');
            this.clearImageUrl();
          }
        },
        error: (error: unknown) => {
          if (requestId === this.imageRequestId) {
            this.imageError.set(
              error instanceof HttpErrorResponse && error.status === 403
                ? 'No tienes permisos para administrar este QR.'
                : 'No fue posible cargar la imagen del QR.',
            );
            this.clearImageUrl();
          }
        },
      });
  }

  private replaceImageUrl(nextUrl: string): void {
    if (this.currentImageUrl) {
      URL.revokeObjectURL(this.currentImageUrl);
    }

    this.currentImageUrl = nextUrl;
    this.imageUrl.set(nextUrl);
  }

  private clearImageUrl(): void {
    this.imageRequestId += 1;

    if (this.currentImageUrl) {
      URL.revokeObjectURL(this.currentImageUrl);
      this.currentImageUrl = null;
    }

    this.imageUrl.set(null);
    this.imageLoading.set(false);
  }

  private loadErrorMessage(error: unknown, resource: string): string {
    if (error instanceof HttpErrorResponse && error.status === 403) {
      return 'No tienes permisos para administrar este QR.';
    }

    if (
      error instanceof HttpErrorResponse &&
      (error.status === 400 || error.status === 422) &&
      isProblemDetail(error.error) &&
      error.error.detail?.trim()
    ) {
      return error.error.detail;
    }

    return `No fue posible cargar ${resource}.`;
  }
}
