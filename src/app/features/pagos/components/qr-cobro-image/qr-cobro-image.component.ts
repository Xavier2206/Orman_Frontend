import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-qr-cobro-image',
  imports: [MatIconModule],
  templateUrl: './qr-cobro-image.component.html',
  styleUrl: './qr-cobro-image.component.css',
})
export class QrCobroImageComponent {
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly imageUrl = input<string | null>(null);
  readonly hasImage = input(false);

  readonly retry = output<void>();
  readonly imageLoadError = output<void>();
}
