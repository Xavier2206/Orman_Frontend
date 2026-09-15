import { Component, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { UnidadFotoView } from '../../models/fotografia.model';

@Component({
  selector: 'app-unidad-fotos',
  imports: [MatIconModule],
  templateUrl: './unidad-fotos.component.html',
  styleUrl: './unidad-fotos.component.css',
})
export class UnidadFotosComponent {
  readonly photos = input<readonly UnidadFotoView[]>([]);
  readonly viewOnly = input(false);
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly emptyMessage = input('Todavía no hay fotografías registradas.');
  readonly emptyDescription = input('Añade imágenes para mostrar los ambientes de la unidad.');

  readonly addRequested = output<void>();
  readonly editRequested = output<UnidadFotoView>();
  readonly replaceRequested = output<UnidadFotoView>();
  readonly coverRequested = output<UnidadFotoView>();
  readonly deleteRequested = output<UnidadFotoView>();

  protected readonly failedImages = signal<ReadonlySet<string>>(new Set());

  protected imageAlt(photo: UnidadFotoView): string {
    return photo.titulo?.trim() || photo.ambiente?.trim() || 'Fotografía de la unidad';
  }

  protected imageFailed(photo: UnidadFotoView): void {
    const failed = new Set(this.failedImages());
    failed.add(photo.key);
    this.failedImages.set(failed);
  }

  protected hasFailedImage(photo: UnidadFotoView): boolean {
    return this.failedImages().has(photo.key);
  }

  protected request(action: () => void): void {
    if (!this.disabled()) {
      action();
    }
  }
}
