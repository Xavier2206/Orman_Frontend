import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-propiedad-cover-field',
  imports: [MatIconModule],
  templateUrl: './propiedad-cover-field.component.html',
  styleUrl: './propiedad-cover-field.component.css',
})
export class PropiedadCoverFieldComponent {
  readonly imageUrl = input<string | null>(null);
  readonly propertyName = input('la propiedad');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly canRemove = input(false);
  readonly removalPending = input(false);
  readonly selectedFileName = input<string | null>(null);
  readonly errorMessage = input<string | null>(null);
  readonly fileSelected = output<File>();
  readonly removeRequested = output<void>();
  readonly validationError = output<string>();

  protected select(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];
    inputElement.value = '';

    if (!file) {
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      this.validationError.emit('La portada debe ser JPG o PNG.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.validationError.emit('La portada no puede superar 5 MiB.');
      return;
    }

    this.fileSelected.emit(file);
  }

  protected remove(): void {
    if (this.disabled() || this.loading() || !this.canRemove()) {
      return;
    }

    this.removeRequested.emit();
  }
}
