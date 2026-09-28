import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  OnDestroy,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Observable, catchError, finalize, map, of, switchMap } from 'rxjs';

import { isProblemDetail } from '../../../../core/api/problem-detail.model';
import { PersonaModalFocusDirective } from '../../../personas/components/persona-modal-focus.directive';
import { QrCobroApiService } from '../../data/qr-cobro-api.service';
import { QrCobroCreateRequest, QrCobroResponse } from '../../models/qr-cobro.model';
import {
  qrCobroDateRangeValidator,
  qrCobroDateValidator,
} from '../../validators/qr-cobro-date.validators';

type QrCobroForm = FormGroup<{
  fechaInicio: FormControl<string>;
  fechaFin: FormControl<string>;
}>;

type SaveOutcome =
  | { readonly kind: 'saved' }
  | { readonly kind: 'create-failed'; readonly error: unknown }
  | { readonly kind: 'recovery-failed'; readonly error: unknown };

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg'];
const ALLOWED_IMAGE_EXTENSION = /\.(png|jpe?g)$/i;
@Component({
  selector: 'app-qr-cobro-config-modal',
  imports: [MatIconModule, ReactiveFormsModule, PersonaModalFocusDirective],
  templateUrl: './qr-cobro-config-modal.component.html',
  styleUrl: './qr-cobro-config-modal.component.css',
})
export class QrCobroConfigModalComponent implements OnDestroy {
  readonly currentQr = input<QrCobroResponse | null>(null);
  readonly closed = output<void>();
  readonly saved = output<void>();
  readonly recoveryFailed = output<void>();

  private readonly qrApi = inject(QrCobroApiService);
  private readonly destroyRef = inject(DestroyRef);
  private previewObjectUrl: string | null = null;

  protected readonly form: QrCobroForm = new FormGroup(
    {
      fechaInicio: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, qrCobroDateValidator],
      }),
      fechaFin: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, qrCobroDateValidator],
      }),
    },
    { validators: qrCobroDateRangeValidator },
  );
  protected readonly selectedImage = signal<File | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly imageError = signal<string | null>(null);
  protected readonly feedback = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly title = computed(() =>
    this.currentQr() ? 'Cambiar QR de cobro' : 'Configurar QR de cobro',
  );

  ngOnDestroy(): void {
    this.releasePreview();
  }

  protected selectImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const image = input.files?.[0] ?? null;
    this.releasePreview();
    this.selectedImage.set(null);
    this.imageError.set(null);
    this.feedback.set(null);

    if (!image) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(image.type) || !ALLOWED_IMAGE_EXTENSION.test(image.name)) {
      this.rejectImage(input, 'Selecciona un archivo PNG o JPG/JPEG.');
      return;
    }

    if (image.size > MAX_IMAGE_SIZE_BYTES) {
      this.rejectImage(input, 'La imagen debe pesar como máximo 5 MiB.');
      return;
    }

    this.selectedImage.set(image);
    this.previewObjectUrl = URL.createObjectURL(image);
    this.previewUrl.set(this.previewObjectUrl);
  }

  protected removeImage(input: HTMLInputElement): void {
    input.value = '';
    this.releasePreview();
    this.selectedImage.set(null);
    this.imageError.set(null);
    this.feedback.set(null);
  }

  protected formatFileSize(bytes: number): string {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toLocaleString('es-BO', { maximumFractionDigits: 1 })} MiB`;
    }

    return `${(bytes / 1024).toLocaleString('es-BO', { maximumFractionDigits: 1 })} KiB`;
  }

  protected showFieldError(controlName: 'fechaInicio' | 'fechaFin', errorName: string): boolean {
    const control = this.form.controls[controlName];
    return (control.touched || control.dirty) && control.hasError(errorName);
  }

  protected close(): void {
    if (this.submitting()) {
      return;
    }

    this.releasePreview();
    this.selectedImage.set(null);
    this.closed.emit();
  }

  protected submit(): void {
    if (this.submitting()) {
      return;
    }

    this.form.markAllAsTouched();
    this.imageError.set(this.selectedImage() ? null : 'Selecciona la imagen del QR.');
    this.feedback.set(null);

    const image = this.selectedImage();
    if (!image || this.form.invalid) {
      return;
    }

    const request = this.form.getRawValue();
    this.form.disable({ emitEvent: false });
    this.submitting.set(true);
    this.saveQr(request, image)
      .pipe(
        finalize(() => {
          this.form.enable({ emitEvent: false });
          this.submitting.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (outcome) => this.handleSaveOutcome(outcome),
        error: (error: unknown) => this.feedback.set(this.errorMessage(error)),
      });
  }

  private saveQr(request: QrCobroCreateRequest, image: File): Observable<SaveOutcome> {
    const currentQr = this.currentQr();

    if (!currentQr) {
      return this.qrApi.create(request, image).pipe(map(() => ({ kind: 'saved' as const })));
    }

    return this.qrApi.changeState(currentQr.codqr, 'INACTIVO').pipe(
      switchMap(() =>
        this.qrApi.create(request, image).pipe(
          map(() => ({ kind: 'saved' as const })),
          catchError((error: unknown) => this.restorePreviousQr(currentQr.codqr, error)),
        ),
      ),
    );
  }

  private restorePreviousQr(codqr: number, error: unknown): Observable<SaveOutcome> {
    return this.qrApi.changeState(codqr, 'ACTIVO').pipe(
      map(() => ({ kind: 'create-failed' as const, error })),
      catchError(() => of({ kind: 'recovery-failed' as const, error })),
    );
  }

  private handleSaveOutcome(outcome: SaveOutcome): void {
    if (outcome.kind === 'saved') {
      this.releasePreview();
      this.selectedImage.set(null);
      this.saved.emit();
      return;
    }

    if (outcome.kind === 'create-failed') {
      this.feedback.set(this.errorMessage(outcome.error));
      return;
    }

    this.feedback.set(
      'No fue posible guardar el nuevo QR ni restaurar automáticamente el QR anterior. Actualiza la pantalla y verifica el estado.',
    );
    this.recoveryFailed.emit();
  }

  private rejectImage(input: HTMLInputElement, message: string): void {
    input.value = '';
    this.imageError.set(message);
  }

  private releasePreview(): void {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }

    this.previewUrl.set(null);
  }

  private errorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible guardar el QR de cobro.';
    }

    if (error.status === 403) {
      return 'No tienes permisos para administrar este QR.';
    }

    if ((error.status === 400 || error.status === 422) && isProblemDetail(error.error)) {
      return error.error.detail?.trim() || 'Revisa la imagen y las fechas ingresadas.';
    }

    return 'No fue posible guardar el QR de cobro.';
  }
}
