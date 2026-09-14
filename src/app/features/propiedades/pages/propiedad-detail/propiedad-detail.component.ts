import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';

import { isProblemDetail } from '../../../../core/api/problem-detail.model';
import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { PropiedadLocationMapComponent } from '../../components/propiedad-location-map/propiedad-location-map.component';
import { PropiedadApiService } from '../../data/propiedad-api.service';
import { PropiedadDetailPdfService } from '../../data/propiedad-detail-pdf.service';
import { PropiedadCoordinates } from '../../models/propiedad-location.model';
import { Propiedad, PropiedadEstado, PropiedadTipo } from '../../models/propiedad.model';
import { formatPropiedadInvestment } from '../../utils/propiedad-formatters';

type DetailErrorKind = 'invalid' | 'not-found' | 'forbidden' | 'generic';

interface DetailLoadResult {
  readonly property: Propiedad | null;
  readonly error: string | null;
  readonly errorKind: DetailErrorKind | null;
}

const COORDINATE_FORMATTER = new Intl.NumberFormat('es-BO', {
  maximumFractionDigits: 7,
});

@Component({
  selector: 'app-propiedad-detail',
  imports: [MatIconModule, PropiedadLocationMapComponent, RouterLink],
  templateUrl: './propiedad-detail.component.html',
  styleUrl: './propiedad-detail.component.css',
})
export class PropiedadDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(PropiedadApiService);
  private readonly pdfService = inject(PropiedadDetailPdfService);
  private readonly notification = inject(OrmanNotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly property = signal<Propiedad | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly errorKind = signal<DetailErrorKind | null>(null);
  protected readonly codprop = signal<number | null>(null);
  protected readonly coverUrl = signal<string | null>(null);
  protected readonly coverBlob = signal<Blob | null>(null);
  protected readonly coverLoading = signal(false);
  protected readonly coverError = signal<string | null>(null);
  protected readonly downloadingPdf = signal(false);
  protected readonly locationCoordinates = computed<PropiedadCoordinates | null>(() => {
    const property = this.property();

    if (!property || property.latitud === null || property.longitud === null) {
      return null;
    }

    return { latitud: property.latitud, longitud: property.longitud };
  });
  protected readonly hasUnitsMetric = computed(() => {
    return typeof this.property()?.cantidadUnidades === 'number';
  });

  private coverRequestRevision = 0;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => this.parseCodprop(params.get('codprop'))),
        distinctUntilChanged(),
        switchMap((codprop) => this.loadProperty(codprop)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => this.handlePropertyResult(result));
  }

  protected typeLabel(type: PropiedadTipo): string {
    return type === 'EDIFICIO' ? 'Edificio' : 'Casa';
  }

  protected statusLabel(status: PropiedadEstado): string {
    return status === 1 ? 'Activa' : 'Inactiva';
  }

  protected formatInvestment(value: number): string {
    return formatPropiedadInvestment(value);
  }

  protected formatCoordinate(value: number): string {
    return COORDINATE_FORMATTER.format(value);
  }

  protected referenceLabel(reference: string | null): string {
    return reference?.trim() || 'No registrada';
  }

  protected unitCountLabel(count: number): string {
    return `${count} ${count === 1 ? 'unidad registrada' : 'unidades registradas'}`;
  }

  protected async downloadPdf(): Promise<void> {
    const property = this.property();

    if (!property || this.downloadingPdf()) {
      return;
    }

    this.downloadingPdf.set(true);

    try {
      await this.pdfService.download(property, this.coverBlob());
      this.notification.success('PDF descargado correctamente.');
    } catch {
      this.notification.error('No fue posible generar el PDF de la propiedad.');
    } finally {
      this.downloadingPdf.set(false);
    }
  }

  private loadProperty(codprop: number | null) {
    this.resetViewState(codprop);

    if (codprop === null) {
      return of<DetailLoadResult>({
        property: null,
        error: 'El identificador de la propiedad no es válido.',
        errorKind: 'invalid',
      });
    }

    return this.api.get(codprop).pipe(
      map((property): DetailLoadResult => ({ property, error: null, errorKind: null })),
      catchError((requestError: unknown) => of(this.detailErrorResult(requestError))),
    );
  }

  private resetViewState(codprop: number | null): void {
    this.codprop.set(codprop);
    this.property.set(null);
    this.loading.set(true);
    this.error.set(null);
    this.errorKind.set(null);
    this.clearCoverState();
  }

  private handlePropertyResult(result: DetailLoadResult): void {
    this.loading.set(false);
    this.property.set(result.property);
    this.error.set(result.error);
    this.errorKind.set(result.errorKind);

    if (result.property) {
      this.loadCover(result.property);
    }
  }

  private loadCover(property: Propiedad): void {
    this.clearCoverState();

    if (!property.tienePortada) {
      return;
    }

    const revision = ++this.coverRequestRevision;
    this.coverLoading.set(true);

    this.api
      .getPortada(property.codprop)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cover) => {
          if (revision !== this.coverRequestRevision) {
            return;
          }

          const coverUrl = URL.createObjectURL(cover);
          this.coverBlob.set(cover);
          this.coverUrl.set(coverUrl);
          this.coverLoading.set(false);
        },
        error: (requestError: unknown) => {
          if (revision !== this.coverRequestRevision) {
            return;
          }

          this.coverLoading.set(false);
          this.coverError.set(this.coverErrorMessage(requestError));
        },
      });
  }

  private clearCoverState(): void {
    this.coverRequestRevision += 1;
    const coverUrl = this.coverUrl();

    if (coverUrl) {
      URL.revokeObjectURL(coverUrl);
    }

    this.coverUrl.set(null);
    this.coverBlob.set(null);
    this.coverLoading.set(false);
    this.coverError.set(null);
  }

  private detailErrorResult(requestError: unknown): DetailLoadResult {
    if (requestError instanceof HttpErrorResponse && requestError.status === 404) {
      return {
        property: null,
        error: 'La propiedad solicitada no existe o ya no está disponible.',
        errorKind: 'not-found',
      };
    }

    if (requestError instanceof HttpErrorResponse && requestError.status === 403) {
      return {
        property: null,
        error: 'No tienes permiso para consultar esta propiedad.',
        errorKind: 'forbidden',
      };
    }

    return {
      property: null,
      error: this.problemMessage(requestError, 'No fue posible cargar el detalle de la propiedad.'),
      errorKind: 'generic',
    };
  }

  private coverErrorMessage(requestError: unknown): string {
    if (requestError instanceof HttpErrorResponse && requestError.status === 404) {
      return 'La portada no está disponible.';
    }

    if (requestError instanceof HttpErrorResponse && requestError.status === 403) {
      return 'No tienes permiso para consultar la portada.';
    }

    return 'No fue posible cargar la portada.';
  }

  private problemMessage(requestError: unknown, fallback: string): string {
    if (requestError instanceof HttpErrorResponse && isProblemDetail(requestError.error)) {
      return requestError.error.detail?.trim() || fallback;
    }

    return fallback;
  }

  private parseCodprop(value: string | null): number | null {
    if (value === null) {
      return null;
    }

    const codprop = Number(value);

    return Number.isSafeInteger(codprop) && codprop > 0 ? codprop : null;
  }

  ngOnDestroy(): void {
    this.clearCoverState();
  }
}
