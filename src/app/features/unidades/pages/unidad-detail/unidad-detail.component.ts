import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';

import { isProblemDetail } from '../../../../core/api/problem-detail.model';
import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { PropiedadApiService } from '../../../propiedades/data/propiedad-api.service';
import { Propiedad } from '../../../propiedades/models/propiedad.model';
import { formatPropiedadInvestment } from '../../../propiedades/utils/propiedad-formatters';
import { UnidadDetailPdfService } from '../../data/unidad-detail-pdf.service';
import { FotografiaApiService } from '../../data/fotografia-api.service';
import { UnidadApiService } from '../../data/unidad-api.service';
import { UnidadFotosComponent } from '../../components/unidad-fotos/unidad-fotos.component';
import { UnidadFotoResponse, UnidadFotoView } from '../../models/fotografia.model';
import { UnidadResponse } from '../../models/unidad.model';
import {
  parseUnidadListContext,
  serializeUnidadListContext,
} from '../../utils/unidad-list-context';

type DetailErrorKind = 'invalid' | 'not-found' | 'forbidden' | 'generic';

interface DetailLoadResult {
  readonly unit: UnidadResponse | null;
  readonly property: Propiedad | null;
  readonly error: string | null;
  readonly errorKind: DetailErrorKind | null;
}

const AREA_FORMATTER = new Intl.NumberFormat('es-BO', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

@Component({
  selector: 'app-unidad-detail',
  imports: [MatIconModule, RouterLink, UnidadFotosComponent],
  templateUrl: './unidad-detail.component.html',
  styleUrl: './unidad-detail.component.css',
})
export class UnidadDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(UnidadApiService);
  private readonly fotografiaApi = inject(FotografiaApiService);
  private readonly propiedadApi = inject(PropiedadApiService);
  private readonly pdfService = inject(UnidadDetailPdfService);
  private readonly notification = inject(OrmanNotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly unit = signal<UnidadResponse | null>(null);
  protected readonly property = signal<Propiedad | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly errorKind = signal<DetailErrorKind | null>(null);
  protected readonly downloadingPdf = signal(false);
  protected readonly photos = signal<readonly UnidadFotoResponse[]>([]);
  protected readonly photosLoading = signal(false);
  protected readonly photosError = signal<string | null>(null);
  protected readonly photoImageUrls = signal<Readonly<Record<number, string>>>({});
  protected readonly photoImageStates = signal<
    Readonly<Record<number, 'loading' | 'ready' | 'error'>>
  >({});
  protected readonly photoViews = computed<readonly UnidadFotoView[]>(() =>
    this.photos().map((photo) => {
      const imageUrl = photo.tieneArchivo
        ? (this.photoImageUrls()[photo.id] ?? null)
        : (photo.url ?? null);
      const imageStatus: UnidadFotoView['imageStatus'] = photo.tieneArchivo
        ? (this.photoImageStates()[photo.id] ?? 'loading')
        : photo.url
          ? 'ready'
          : 'unavailable';

      return {
        key: `detail-${photo.id}-${imageUrl ?? imageStatus}`,
        id: photo.id,
        titulo: photo.titulo,
        ambiente: photo.ambiente,
        orden: photo.orden,
        portada: photo.portada,
        imageUrl,
        imageStatus,
        pending: false,
        fileName: null,
      } satisfies UnidadFotoView;
    }),
  );
  protected readonly photoImagesLoading = computed(
    () =>
      this.photosLoading() || this.photoViews().some((photo) => photo.imageStatus === 'loading'),
  );
  protected readonly returnQueryParams = serializeUnidadListContext(
    parseUnidadListContext(this.route.snapshot.queryParamMap),
  );
  protected readonly propertyLabel = computed(() => {
    const property = this.property();

    return property ? property.nombre : null;
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => this.parseIdentifier(params.get('coduni'))),
        distinctUntilChanged(),
        switchMap((coduni) => this.loadUnit(coduni)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => this.handleLoadResult(result));
  }

  protected statusLabel(status: number): string {
    return status === 1 ? 'OPERATIVA' : 'NO OPERATIVA';
  }

  protected formatArea(area: number): string {
    return `${AREA_FORMATTER.format(area)} m²`;
  }

  protected formatPrice(price: number): string {
    return formatPropiedadInvestment(price);
  }

  protected optionalLabel(value: string | null): string {
    return value?.trim() || 'No registrada';
  }

  protected async downloadPdf(): Promise<void> {
    const unit = this.unit();

    if (!unit || this.downloadingPdf() || this.photoImagesLoading()) {
      return;
    }

    this.downloadingPdf.set(true);

    try {
      await this.pdfService.download(unit, this.property(), this.photoViews());
      this.notification.success('PDF descargado correctamente.');
    } catch {
      this.notification.error('No fue posible generar el PDF de la unidad.');
    } finally {
      this.downloadingPdf.set(false);
    }
  }

  private loadUnit(coduni: number | null) {
    this.resetViewState();

    if (coduni === null) {
      return of<DetailLoadResult>({
        unit: null,
        property: null,
        error: 'El identificador de la unidad no es válido.',
        errorKind: 'invalid',
      });
    }

    return this.api.get(coduni).pipe(
      switchMap((unit) =>
        this.propiedadApi.get(unit.codprop).pipe(
          map((property): DetailLoadResult => ({
            unit,
            property,
            error: null,
            errorKind: null,
          })),
          catchError(() =>
            of<DetailLoadResult>({
              unit,
              property: null,
              error: null,
              errorKind: null,
            }),
          ),
        ),
      ),
      catchError((requestError: unknown) => of(this.detailErrorResult(requestError))),
    );
  }

  private resetViewState(): void {
    this.unit.set(null);
    this.property.set(null);
    this.loading.set(true);
    this.error.set(null);
    this.errorKind.set(null);
  }

  private handleLoadResult(result: DetailLoadResult): void {
    this.loading.set(false);
    this.unit.set(result.unit);
    this.property.set(result.property);
    this.error.set(result.error);
    this.errorKind.set(result.errorKind);
    if (result.unit) {
      this.loadPhotos(result.unit.coduni);
    }
  }

  private loadPhotos(coduni: number): void {
    this.photosLoading.set(true);
    this.photosError.set(null);
    this.clearPhotoImages();
    this.fotografiaApi
      .list(coduni)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (photos) => {
          this.photosLoading.set(false);
          const sortedPhotos = [...photos].sort(
            (left, right) => left.orden - right.orden || left.id - right.id,
          );
          this.photos.set(sortedPhotos);
          for (const photo of sortedPhotos) {
            if (photo.tieneArchivo) {
              this.photoImageStates.update((states) => ({ ...states, [photo.id]: 'loading' }));
              this.loadPhotoImage(coduni, photo.id);
            }
          }
        },
        error: (requestError: unknown) => {
          this.photosLoading.set(false);
          this.photos.set([]);
          this.photosError.set(this.photoErrorMessage(requestError));
        },
      });
  }

  private loadPhotoImage(coduni: number, id: number): void {
    this.fotografiaApi
      .getArchivo(coduni, id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.releasePhotoImage(id);
          this.photoImageUrls.update((urls) => ({ ...urls, [id]: URL.createObjectURL(blob) }));
          this.photoImageStates.update((states) => ({ ...states, [id]: 'ready' }));
        },
        error: () => {
          this.photoImageStates.update((states) => ({ ...states, [id]: 'error' }));
        },
      });
  }

  private photoErrorMessage(requestError: unknown): string {
    if (requestError instanceof HttpErrorResponse && isProblemDetail(requestError.error)) {
      return (
        requestError.error.detail?.trim() || 'No fue posible cargar las fotografías de la unidad.'
      );
    }
    if (requestError instanceof HttpErrorResponse && requestError.status === 403) {
      return 'No tienes permisos para consultar las fotografías de esta unidad.';
    }
    return 'No fue posible cargar las fotografías de la unidad.';
  }

  private releasePhotoImage(id: number): void {
    const url = this.photoImageUrls()[id];
    if (!url) {
      return;
    }

    URL.revokeObjectURL(url);
    this.photoImageUrls.update((urls) => {
      const next = { ...urls };
      delete next[id];
      return next;
    });
  }

  private clearPhotoImages(): void {
    for (const url of Object.values(this.photoImageUrls())) {
      URL.revokeObjectURL(url);
    }
    this.photoImageUrls.set({});
    this.photoImageStates.set({});
  }

  ngOnDestroy(): void {
    this.clearPhotoImages();
  }

  private detailErrorResult(requestError: unknown): DetailLoadResult {
    if (requestError instanceof HttpErrorResponse && requestError.status === 404) {
      return {
        unit: null,
        property: null,
        error: 'La unidad solicitada no existe o no puede consultarse.',
        errorKind: 'not-found',
      };
    }

    if (requestError instanceof HttpErrorResponse && requestError.status === 403) {
      return {
        unit: null,
        property: null,
        error: 'No tienes permiso para consultar esta unidad.',
        errorKind: 'forbidden',
      };
    }

    return {
      unit: null,
      property: null,
      error: this.problemMessage(requestError, 'No fue posible cargar el detalle de la unidad.'),
      errorKind: 'generic',
    };
  }

  private problemMessage(requestError: unknown, fallback: string): string {
    if (requestError instanceof HttpErrorResponse && isProblemDetail(requestError.error)) {
      return requestError.error.detail?.trim() || fallback;
    }

    return fallback;
  }

  private parseIdentifier(value: string | null): number | null {
    if (value === null) {
      return null;
    }

    const identifier = Number(value);

    return Number.isSafeInteger(identifier) && identifier > 0 ? identifier : null;
  }
}
