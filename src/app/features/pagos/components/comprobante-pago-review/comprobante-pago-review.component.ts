import {
  Component,
  DestroyRef,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { EMPTY, Subject, catchError, finalize, forkJoin, of, switchMap } from 'rxjs';

import { PagoApiService, PagoComprobanteMetadata } from '../../../contratos/data/pago-api.service';

const RECEIPT_LOAD_ERROR = 'No se pudo cargar el comprobante.';

interface ReceiptLoadResult {
  readonly metadata: PagoComprobanteMetadata | null;
  readonly imageUrl: string | null;
}

@Component({
  selector: 'app-comprobante-pago-review',
  imports: [MatIconModule],
  templateUrl: './comprobante-pago-review.component.html',
  styleUrl: './comprobante-pago-review.component.css',
})
export class ComprobantePagoReviewComponent implements OnChanges, OnDestroy {
  readonly codpag = input.required<number>();
  readonly loadedChange = output<boolean>();

  private readonly paymentApi = inject(PagoApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly receiptRequests$ = new Subject<number | null>();

  protected readonly metadata = signal<PagoComprobanteMetadata | null>(null);
  protected readonly receiptUrl = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly previewExpanded = signal(false);

  constructor() {
    this.receiptRequests$
      .pipe(
        switchMap((codpag) => {
          if (codpag === null) {
            return EMPTY;
          }

          this.loading.set(true);
          this.error.set(null);

          return forkJoin({
            metadata: this.paymentApi.getReceiptMetadata(codpag).pipe(catchError(() => of(null))),
            imageUrl: this.paymentApi.getReceipt(codpag).pipe(
              switchMap((blob) =>
                this.isSupportedImage(blob.type) ? of(URL.createObjectURL(blob)) : of(null),
              ),
              catchError(() => {
                this.error.set(RECEIPT_LOAD_ERROR);
                return of(null);
              }),
            ),
          }).pipe(finalize(() => this.loading.set(false)));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => this.acceptReceipt(result));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['codpag']) {
      return;
    }

    this.resetReceipt();
    this.receiptRequests$.next(this.codpag());
  }

  ngOnDestroy(): void {
    this.receiptRequests$.next(null);
    this.clearObjectUrl();
  }

  protected retry(): void {
    if (!this.loading()) {
      this.resetReceipt();
      this.receiptRequests$.next(this.codpag());
    }
  }

  protected togglePreview(): void {
    this.previewExpanded.update((expanded) => !expanded);
  }

  protected formatDateTime(value: string): string {
    const [date, time] = value.split('T');
    const [year, month, day] = date.split('-');

    if (!year || !month || !day) {
      return value;
    }

    return `${day}/${month}/${year}${time ? ` ${time.slice(0, 5)}` : ''}`;
  }

  releaseObjectUrl(): void {
    this.clearObjectUrl();
    this.loadedChange.emit(false);
  }

  private acceptReceipt(result: ReceiptLoadResult): void {
    this.metadata.set(result.metadata);
    this.receiptUrl.set(result.imageUrl);

    if (!result.imageUrl) {
      this.error.set(RECEIPT_LOAD_ERROR);
      this.loadedChange.emit(false);
      return;
    }

    this.loadedChange.emit(true);
  }

  private resetReceipt(): void {
    this.clearObjectUrl();
    this.metadata.set(null);
    this.loading.set(false);
    this.error.set(null);
    this.previewExpanded.set(false);
    this.loadedChange.emit(false);
  }

  private clearObjectUrl(): void {
    const currentUrl = this.receiptUrl();

    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
      this.receiptUrl.set(null);
    }
  }

  private isSupportedImage(contentType: string): boolean {
    const normalizedType = contentType.toLowerCase().split(';')[0].trim();
    return normalizedType === 'image/jpeg' || normalizedType === 'image/png';
  }
}
