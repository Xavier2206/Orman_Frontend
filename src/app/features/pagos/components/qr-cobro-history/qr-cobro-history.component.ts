import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import {
  formatQrCobroDate,
  formatQrCobroDateTime,
  qrCobroStateLabel,
} from '../../models/qr-cobro-display';
import { QrCobroResponse } from '../../models/qr-cobro.model';

@Component({
  selector: 'app-qr-cobro-history',
  imports: [MatIconModule],
  templateUrl: './qr-cobro-history.component.html',
  styleUrl: './qr-cobro-history.component.css',
})
export class QrCobroHistoryComponent {
  readonly records = input<readonly QrCobroResponse[]>([]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly retry = output<void>();

  protected formatDate = formatQrCobroDate;
  protected formatDateTime = formatQrCobroDateTime;
  protected stateLabel = qrCobroStateLabel;
}
