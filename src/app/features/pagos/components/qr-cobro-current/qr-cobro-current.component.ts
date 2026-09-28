import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { QrCobroImageComponent } from '../qr-cobro-image/qr-cobro-image.component';
import { formatQrCobroDate, qrCobroStateLabel } from '../../models/qr-cobro-display';
import { QrCobroResponse } from '../../models/qr-cobro.model';

@Component({
  selector: 'app-qr-cobro-current',
  imports: [MatIconModule, QrCobroImageComponent],
  templateUrl: './qr-cobro-current.component.html',
  styleUrl: './qr-cobro-current.component.css',
})
export class QrCobroCurrentComponent {
  readonly currentQr = input<QrCobroResponse | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly imageLoading = input(false);
  readonly imageError = input<string | null>(null);
  readonly imageUrl = input<string | null>(null);
  readonly hasHistory = input(false);

  readonly retryCurrent = output<void>();
  readonly retryImage = output<void>();
  readonly configure = output<void>();
  readonly imageLoadError = output<void>();

  protected formatDate = formatQrCobroDate;
  protected stateLabel = qrCobroStateLabel;
}
