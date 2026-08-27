import { Component, OnDestroy, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-persona-photo-field',
  imports: [MatIconModule],
  templateUrl: './persona-photo-field.component.html',
  styleUrl: './persona-photo-field.component.css',
})
export class PersonaPhotoFieldComponent implements OnDestroy {
  readonly imageUrl = input<string | null>(null);
  readonly initials = input('P');
  readonly disabled = input(false);
  readonly canRemove = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly fileSelected = output<File | null>();
  readonly removeRequested = output<void>();
  readonly validationError = output<string>();
  protected readonly preview = signal<string | null>(null);
  protected readonly selectedFileName = signal<string | null>(null);
  private selectedFile: File | null = null;

  protected select(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      this.validationError.emit('La fotografía debe ser JPG o PNG.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.validationError.emit('La fotografía no puede superar 2 MB.');
      return;
    }

    this.clearPreview();
    this.selectedFile = file;
    this.selectedFileName.set(file.name);
    this.preview.set(URL.createObjectURL(file));
    this.fileSelected.emit(file);
  }

  protected remove(): void {
    if (this.selectedFile) {
      this.clearPreview();
      this.fileSelected.emit(null);
      return;
    }
    if (this.canRemove()) this.removeRequested.emit();
  }

  ngOnDestroy(): void {
    this.clearPreview();
  }
  private clearPreview(): void {
    if (this.preview()) {
      URL.revokeObjectURL(this.preview()!);
    }

    this.preview.set(null);
    this.selectedFile = null;
    this.selectedFileName.set(null);
  }
}
