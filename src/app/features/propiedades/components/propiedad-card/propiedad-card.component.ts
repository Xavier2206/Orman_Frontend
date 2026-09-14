import {
  OnChanges,
  OnDestroy,
  SimpleChanges,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, finalize } from 'rxjs';

import { PropiedadApiService } from '../../data/propiedad-api.service';
import { Propiedad } from '../../models/propiedad.model';
import {
  formatPropiedadInvestment,
  formatPropiedadOccupancy,
} from '../../utils/propiedad-formatters';

@Component({
  selector: 'app-propiedad-card',
  imports: [MatIconModule],
  templateUrl: './propiedad-card.component.html',
  styleUrl: './propiedad-card.component.css',
})
export class PropiedadCardComponent implements OnChanges, OnDestroy {
  private readonly api = inject(PropiedadApiService);
  private readonly destroyRef = inject(DestroyRef);
  private coverRequest: Subscription | null = null;
  private coverRequestedFor: number | null = null;
  private coverObjectUrl: string | null = null;

  readonly propiedad = input.required<Propiedad>();

  readonly detailRequested = output<void>();
  readonly editRequested = output<void>();
  readonly activateRequested = output<void>();
  readonly deactivateRequested = output<void>();
  protected readonly coverUrl = signal<string | null>(null);
  protected readonly coverLoading = signal(false);
  protected readonly coverError = signal(false);

  protected statusLabel(estado: Propiedad['estado']): string {
    return estado === 1 ? 'ACTIVA' : 'INACTIVA';
  }

  protected formatInvestment(value: number): string {
    return formatPropiedadInvestment(value);
  }

  protected unitCountLabel(count: number): string {
    return `${count} ${count === 1 ? 'Unidad' : 'Unidades'}`;
  }

  protected enabledUnitCountLabel(count: number): string {
    return `${count} ${count === 1 ? 'habilitada' : 'habilitadas'}`;
  }

  protected occupancyLabel(occupiedCount: number, enabledCount: number): string {
    return `${occupiedCount} de ${enabledCount} ${occupiedCount === 1 ? 'ocupada' : 'ocupadas'}`;
  }

  protected formatOccupancy(value: number): string {
    return formatPropiedadOccupancy(value);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['propiedad']) {
      return;
    }

    const property = this.propiedad();

    if (!property.tienePortada) {
      this.clearCover();
      return;
    }

    if (this.coverRequestedFor === property.codprop) {
      return;
    }

    this.loadCover(property.codprop);
  }

  ngOnDestroy(): void {
    this.coverRequest?.unsubscribe();
    this.releaseCoverObjectUrl();
  }

  private loadCover(codprop: number): void {
    this.coverRequest?.unsubscribe();
    this.releaseCoverObjectUrl();
    this.coverRequestedFor = codprop;
    this.coverLoading.set(true);
    this.coverError.set(false);

    this.coverRequest = this.api
      .getPortada(codprop)
      .pipe(
        finalize(() => this.coverLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (blob) => {
          this.coverObjectUrl = URL.createObjectURL(blob);
          this.coverUrl.set(this.coverObjectUrl);
        },
        error: () => {
          this.coverError.set(true);
        },
      });
  }

  private clearCover(): void {
    this.coverRequest?.unsubscribe();
    this.coverRequest = null;
    this.coverRequestedFor = null;
    this.coverLoading.set(false);
    this.coverError.set(false);
    this.releaseCoverObjectUrl();
  }

  private releaseCoverObjectUrl(): void {
    if (this.coverObjectUrl) {
      URL.revokeObjectURL(this.coverObjectUrl);
      this.coverObjectUrl = null;
    }

    this.coverUrl.set(null);
  }
}
