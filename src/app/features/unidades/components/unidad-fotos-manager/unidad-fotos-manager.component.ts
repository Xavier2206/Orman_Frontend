import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  Observable,
  catchError,
  concatMap,
  finalize,
  from,
  map,
  of,
  reduce,
  switchMap,
} from 'rxjs';

import { isProblemDetail } from '../../../../core/api/problem-detail.model';
import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { UnidadFotosComponent } from '../unidad-fotos/unidad-fotos.component';
import { FotografiaApiService } from '../../data/fotografia-api.service';
import {
  UnidadFotoMetadataRequest,
  UnidadFotoResponse,
  UnidadFotoView,
} from '../../models/fotografia.model';
import { UnidadResponse } from '../../models/unidad.model';

interface PendingUnidadFoto {
  readonly key: string;
  readonly file: File;
  readonly previewUrl: string;
  readonly titulo: string | null;
  readonly ambiente: string | null;
  readonly orden: number;
  readonly portada: boolean;
}

type PhotoEditorTarget =
  | { readonly kind: 'pending'; readonly key: string }
  | { readonly kind: 'existing'; readonly id: number };

type PhotoImageState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-unidad-fotos-manager',
  imports: [MatIconModule, ReactiveFormsModule, UnidadFotosComponent],
  templateUrl: './unidad-fotos-manager.component.html',
  styleUrl: './unidad-fotos-manager.component.css',
})
export class UnidadFotosManagerComponent implements OnDestroy {
  readonly coduni = input<number | null>(null);
  readonly editMode = input(false);
  readonly disabled = input(false);

  private readonly fotografiaApi = inject(FotografiaApiService);
  private readonly notification = inject(OrmanNotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private loadedUnitId: number | null = null;
  private replaceTargetId: number | null = null;

  protected readonly photos = signal<readonly UnidadFotoResponse[]>([]);
  protected readonly pendingPhotos = signal<readonly PendingUnidadFoto[]>([]);
  protected readonly photoLoading = signal(false);
  protected readonly photoError = signal<string | null>(null);
  protected readonly photoActionError = signal<string | null>(null);
  protected readonly photoActionBusy = signal(false);
  protected readonly photoImageUrls = signal<Readonly<Record<number, string>>>({});
  protected readonly photoImageStates = signal<Readonly<Record<number, PhotoImageState>>>({});
  protected readonly photoEditorOpen = signal(false);
  protected readonly photoEditorTarget = signal<PhotoEditorTarget | null>(null);
  protected readonly photoEditorSaving = signal(false);
  protected readonly photoEditorFeedback = signal<string | null>(null);
  protected readonly photoEditorForm = new FormGroup({
    titulo: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(150)] }),
    ambiente: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
  });
  protected readonly photoViews = computed<readonly UnidadFotoView[]>(() => {
    const existing = this.photos().map((photo) => {
      const imageUrl = photo.url ?? this.photoImageUrls()[photo.id] ?? null;
      const imageStatus: UnidadFotoView['imageStatus'] = photo.url
        ? 'ready'
        : (this.photoImageStates()[photo.id] ?? 'loading');

      return {
        key: `existing-${photo.id}-${imageUrl ?? imageStatus}`,
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
    });
    const pending = this.pendingPhotos().map((photo) => ({
      key: photo.key,
      id: null,
      titulo: photo.titulo,
      ambiente: photo.ambiente,
      orden: photo.orden,
      portada: photo.portada,
      imageUrl: photo.previewUrl,
      imageStatus: 'ready',
      pending: true,
      fileName: photo.file.name,
    }) satisfies UnidadFotoView);

    return [...existing, ...pending].sort(
      (left, right) => left.orden - right.orden || left.key.localeCompare(right.key),
    );
  });

  constructor() {
    effect(() => {
      const coduni = this.coduni();
      if (this.editMode() && coduni !== null && coduni !== this.loadedUnitId) {
        this.loadedUnitId = coduni;
        this.loadPhotos(coduni);
      }
    });
  }

  protected addPhoto(): void {
    this.photoActionError.set(null);
    const input = document.getElementById('unit-photo-add-input') as HTMLInputElement | null;
    input?.click();
  }

  protected selectPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';

    if (!file) {
      return;
    }

    const validationError = this.validatePhotoFile(file);
    if (validationError) {
      this.photoActionError.set(validationError);
      return;
    }

    if (this.editMode()) {
      this.createPhotoImmediately(file);
      return;
    }

    const pendingPhoto: PendingUnidadFoto = {
      key: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      titulo: null,
      ambiente: null,
      orden: this.nextPhotoOrder(),
      portada: this.pendingPhotos().length === 0 && this.photos().length === 0,
    };
    this.pendingPhotos.update((photos) => [...photos, pendingPhoto]);
  }

  protected editPhoto(photo: UnidadFotoView): void {
    const target: PhotoEditorTarget = photo.pending
      ? { kind: 'pending', key: photo.key }
      : { kind: 'existing', id: photo.id! };
    const source = photo.pending
      ? this.pendingPhotos().find((candidate) => candidate.key === photo.key)
      : this.photos().find((candidate) => candidate.id === photo.id);

    if (!source) {
      return;
    }

    this.photoEditorTarget.set(target);
    this.photoEditorForm.reset({ titulo: source.titulo ?? '', ambiente: source.ambiente ?? '' });
    this.photoEditorFeedback.set(null);
    this.photoEditorOpen.set(true);
  }

  protected closePhotoEditor(): void {
    if (this.photoEditorSaving()) {
      return;
    }

    this.photoEditorOpen.set(false);
    this.photoEditorTarget.set(null);
    this.photoEditorFeedback.set(null);
  }

  protected savePhotoMetadata(): void {
    this.photoEditorForm.markAllAsTouched();
    if (this.photoEditorForm.invalid || this.photoEditorSaving()) {
      return;
    }

    const target = this.photoEditorTarget();
    if (!target) {
      return;
    }

    const values = this.photoEditorForm.getRawValue();
    const metadata = {
      titulo: this.optionalText(values.titulo),
      ambiente: this.optionalText(values.ambiente),
    };

    if (target.kind === 'pending') {
      this.pendingPhotos.update((photos) =>
        photos.map((photo) => (photo.key === target.key ? { ...photo, ...metadata } : photo)),
      );
      this.closePhotoEditor();
      return;
    }

    const currentPhoto = this.photos().find((photo) => photo.id === target.id);
    const coduni = this.coduni();
    if (!currentPhoto || coduni === null) {
      return;
    }

    const request: UnidadFotoMetadataRequest = {
      ...metadata,
      orden: currentPhoto.orden,
    };
    this.photoEditorSaving.set(true);
    this.photoEditorFeedback.set(null);
    this.fotografiaApi
      .updateMetadata(coduni, target.id, request)
      .pipe(
        finalize(() => this.photoEditorSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.updatePhotoFromResponse(updated);
          this.closePhotoEditor();
          this.notification.success('Metadatos de la fotografía actualizados.');
        },
        error: (requestError: unknown) => {
          this.photoEditorFeedback.set(this.photoErrorMessage(requestError));
        },
      });
  }

  protected photoFieldMessage(field: 'titulo' | 'ambiente'): string | null {
    const control = this.photoEditorForm.controls[field];
    if (control.invalid && control.touched && control.hasError('maxlength')) {
      return field === 'titulo'
        ? 'El título no puede superar 150 caracteres.'
        : 'El ambiente no puede superar 100 caracteres.';
    }

    return null;
  }

  protected replacePhoto(photo: UnidadFotoView): void {
    if (photo.id === null || photo.pending) {
      return;
    }

    const input = document.getElementById('unit-photo-replace-input') as HTMLInputElement | null;
    this.replaceTargetId = photo.id;
    input?.click();
  }

  protected selectReplacement(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    const photoId = this.replaceTargetId;
    this.replaceTargetId = null;

    if (!file || photoId === null) {
      return;
    }

    const validationError = this.validatePhotoFile(file);
    if (validationError) {
      this.photoActionError.set(validationError);
      return;
    }

    const coduni = this.coduni();
    if (coduni === null) {
      return;
    }

    this.photoActionBusy.set(true);
    this.photoActionError.set(null);
    this.fotografiaApi
      .replaceArchivo(coduni, photoId, file)
      .pipe(
        finalize(() => this.photoActionBusy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.releasePhotoImage(photoId);
          this.updatePhotoFromResponse(updated);
          this.loadPhotoImage(updated.id);
          this.notification.success('Fotografía reemplazada correctamente.');
        },
        error: (requestError: unknown) => {
          this.photoActionError.set(this.photoErrorMessage(requestError));
        },
      });
  }

  protected setCover(photo: UnidadFotoView): void {
    if (photo.id === null) {
      this.pendingPhotos.update((photos) =>
        photos.map((candidate) => ({ ...candidate, portada: candidate.key === photo.key })),
      );
      return;
    }

    const coduni = this.coduni();
    if (coduni === null) {
      return;
    }

    this.photoActionBusy.set(true);
    this.photoActionError.set(null);
    this.fotografiaApi
      .setPortada(coduni, photo.id)
      .pipe(
        finalize(() => this.photoActionBusy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.photos.update((photos) =>
            photos.map((candidate) => ({ ...candidate, portada: candidate.id === updated.id })),
          );
          this.notification.success('Portada de la unidad actualizada.');
        },
        error: (requestError: unknown) => {
          this.photoActionError.set(this.photoErrorMessage(requestError));
        },
      });
  }

  protected deletePhoto(photo: UnidadFotoView): void {
    if (photo.id === null) {
      this.removePendingPhoto(photo.key);
      return;
    }

    const coduni = this.coduni();
    if (coduni === null) {
      return;
    }

    this.photoActionBusy.set(true);
    this.photoActionError.set(null);
    this.fotografiaApi
      .delete(coduni, photo.id)
      .pipe(
        finalize(() => this.photoActionBusy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.releasePhotoImage(photo.id!);
          this.photos.update((photos) => photos.filter((candidate) => candidate.id !== photo.id));
          this.notification.success('Fotografía eliminada correctamente.');
        },
        error: (requestError: unknown) => {
          this.photoActionError.set(this.photoErrorMessage(requestError));
        },
      });
  }

  persistPendingPhotos(unit: UnidadResponse): Observable<{ readonly failures: number }> {
    const pending = this.pendingPhotos();
    if (pending.length === 0) {
      return of({ failures: 0 });
    }

    return from(pending).pipe(
      concatMap((photo) => {
        const metadata: UnidadFotoMetadataRequest = {
          titulo: photo.titulo,
          ambiente: photo.ambiente,
          orden: photo.orden,
        };
        return this.fotografiaApi.createInternal(unit.coduni, photo.file, metadata).pipe(
          switchMap((created) =>
            photo.portada
              ? this.fotografiaApi.setPortada(unit.coduni, created.id).pipe(map(() => created))
              : of(created),
          ),
          map(() => ({ failures: 0 })),
          catchError(() => of({ failures: 1 })),
        );
      }),
      reduce((total, current) => ({ failures: total.failures + current.failures }), { failures: 0 }),
      finalize(() => this.clearPendingPhotos()),
    );
  }

  private createPhotoImmediately(file: File): void {
    const coduni = this.coduni();
    if (coduni === null) {
      return;
    }

    const metadata: UnidadFotoMetadataRequest = {
      titulo: null,
      ambiente: null,
      orden: this.nextPhotoOrder(),
    };
    this.photoActionBusy.set(true);
    this.photoActionError.set(null);
    this.fotografiaApi
      .createInternal(coduni, file, metadata)
      .pipe(
        finalize(() => this.photoActionBusy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (created) => {
          this.photos.update((photos) => [...photos, created]);
          this.setPhotoImageLoading(created.id);
          this.loadPhotoImage(created.id);
          this.notification.success('Fotografía añadida correctamente.');
        },
        error: (requestError: unknown) => {
          this.photoActionError.set(this.photoErrorMessage(requestError));
        },
      });
  }

  private loadPhotos(coduni: number): void {
    this.photoLoading.set(true);
    this.photoError.set(null);
    this.clearPhotoImages();
    this.fotografiaApi
      .list(coduni)
      .pipe(
        finalize(() => this.photoLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (photos) => {
          this.photos.set([...photos].sort((left, right) => left.orden - right.orden || left.id - right.id));
          for (const photo of photos) {
            if (photo.tieneArchivo) {
              this.setPhotoImageLoading(photo.id);
              this.loadPhotoImage(photo.id);
            }
          }
        },
        error: (requestError: unknown) => {
          this.photos.set([]);
          this.photoError.set(this.photoErrorMessage(requestError));
        },
      });
  }

  private loadPhotoImage(id: number): void {
    const coduni = this.coduni();
    if (coduni === null) {
      return;
    }

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

  private nextPhotoOrder(): number {
    const orders = [
      ...this.photos().map((photo) => photo.orden),
      ...this.pendingPhotos().map((photo) => photo.orden),
    ];
    return orders.length === 0 ? 0 : Math.max(...orders) + 1;
  }

  private updatePhotoFromResponse(photo: UnidadFotoResponse): void {
    this.photos.update((photos) =>
      photos.map((candidate) => (candidate.id === photo.id ? photo : candidate)),
    );
  }

  private setPhotoImageLoading(id: number): void {
    this.photoImageStates.update((states) => ({ ...states, [id]: 'loading' }));
  }

  private removePendingPhoto(key: string): void {
    const photo = this.pendingPhotos().find((candidate) => candidate.key === key);
    if (photo) {
      URL.revokeObjectURL(photo.previewUrl);
    }
    this.pendingPhotos.update((photos) => photos.filter((candidate) => candidate.key !== key));
  }

  private releasePhotoImage(id: number): void {
    const url = this.photoImageUrls()[id];
    if (url) {
      URL.revokeObjectURL(url);
      this.photoImageUrls.update((urls) => {
        const next = { ...urls };
        delete next[id];
        return next;
      });
    }
  }

  private clearPhotoImages(): void {
    for (const url of Object.values(this.photoImageUrls())) {
      URL.revokeObjectURL(url);
    }
    this.photoImageUrls.set({});
    this.photoImageStates.set({});
  }

  private clearPendingPhotos(): void {
    for (const photo of this.pendingPhotos()) {
      URL.revokeObjectURL(photo.previewUrl);
    }
    this.pendingPhotos.set([]);
  }

  private validatePhotoFile(file: File): string | null {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      return 'La fotografía debe ser JPG o PNG.';
    }
    if (file.size > 5 * 1024 * 1024) {
      return 'La fotografía no puede superar 5 MiB.';
    }
    return null;
  }

  private photoErrorMessage(requestError: unknown): string {
    if (requestError instanceof HttpErrorResponse && isProblemDetail(requestError.error)) {
      return requestError.error.detail?.trim() || 'No fue posible completar la acción sobre la fotografía.';
    }
    if (requestError instanceof HttpErrorResponse && requestError.status === 403) {
      return 'No tienes permisos para administrar las fotografías de esta unidad.';
    }
    return 'No fue posible completar la acción sobre la fotografía.';
  }

  private optionalText(value: string): string | null {
    const trimmed = value.trim();
    return trimmed || null;
  }

  ngOnDestroy(): void {
    this.clearPhotoImages();
    this.clearPendingPhotos();
  }
}
