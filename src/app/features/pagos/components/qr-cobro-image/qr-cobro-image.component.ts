import { Component, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PersonaModalFocusDirective } from '../../../personas/components/persona-modal-focus.directive';

const DOWNLOAD_URL_REVOKE_DELAY_MS = 60_000;

@Component({
  selector: 'app-qr-cobro-image',
  imports: [MatIconModule, PersonaModalFocusDirective],
  templateUrl: './qr-cobro-image.component.html',
  styleUrl: './qr-cobro-image.component.css',
})
export class QrCobroImageComponent {
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly imageUrl = input<string | null>(null);
  readonly imageBlob = input<Blob | null>(null);
  readonly hasImage = input(false);
  readonly loaded = input(false);
  readonly downloadFilename = input<string | null>(null);

  readonly retry = output<void>();
  readonly imageLoadError = output<void>();
  readonly imageLoaded = output<void>();

  protected readonly previewOpen = signal(false);
  protected readonly downloadError = signal<{ image: Blob; message: string } | null>(null);

  protected openPreview(): void {
    this.previewOpen.set(true);
  }

  protected closePreview(): void {
    this.previewOpen.set(false);
  }

  protected handleImageLoadError(): void {
    this.previewOpen.set(false);
    this.imageLoadError.emit();
  }

  protected downloadOriginal(): void {
    const image = this.imageBlob();
    const filename = this.downloadFilename();

    if (!image || !filename) {
      if (image) {
        this.downloadError.set({
          image,
          message: 'No se pudo preparar la descarga de la imagen QR.',
        });
      }

      return;
    }

    let downloadUrl: string | null = null;
    const downloadLink = document.createElement('a');

    try {
      const createdUrl = URL.createObjectURL(image);
      downloadUrl = createdUrl;
      downloadLink.href = createdUrl;
      downloadLink.download = filename;
      downloadLink.hidden = true;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      window.setTimeout(() => URL.revokeObjectURL(createdUrl), DOWNLOAD_URL_REVOKE_DELAY_MS);
      this.downloadError.set(null);
    } catch {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }

      this.downloadError.set({
        image,
        message: 'No fue posible iniciar la descarga del QR. Inténtalo nuevamente.',
      });
    } finally {
      downloadLink.remove();
    }
  }
}
