import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { DashboardFinancieroApiService } from '../../data/dashboard-financiero-api.service';
import {
  DashboardIngresoMensual,
  DashboardPropiedadFinanciera,
  DashboardResumenFinancieroResponse,
} from '../../models/dashboard-financiero.model';
import { DashboardComparativeChartComponent } from '../../components/dashboard-comparative-chart/dashboard-comparative-chart.component';
import { DashboardMonthlyChartComponent } from '../../components/dashboard-monthly-chart/dashboard-monthly-chart.component';
import { DashboardRecoveryChartComponent } from '../../components/dashboard-recovery-chart/dashboard-recovery-chart.component';
import { DashboardPropertyRecoveryChartComponent } from '../../components/dashboard-property-recovery-chart/dashboard-property-recovery-chart.component';
import {
  formatDashboardAmount,
  formatDashboardPercent,
} from '../../models/dashboard-financiero-format';

type DashboardViewMode = 'general' | 'propiedad';
type DashboardLoadError = 'session' | 'forbidden' | 'general';

@Component({
  selector: 'app-resumen-financiero',
  imports: [
    DashboardComparativeChartComponent,
    DashboardMonthlyChartComponent,
    DashboardRecoveryChartComponent,
    DashboardPropertyRecoveryChartComponent,
  ],
  templateUrl: './resumen-financiero.component.html',
  styleUrl: './resumen-financiero.component.css',
})
export class ResumenFinancieroComponent {
  private readonly api = inject(DashboardFinancieroApiService);

  protected readonly report = signal<DashboardResumenFinancieroResponse | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly loadError = signal<DashboardLoadError | null>(null);
  protected readonly viewMode = signal<DashboardViewMode>('general');
  protected readonly selectedPropertyId = signal<number | null>(null);
  protected readonly properties = computed(() => this.report()?.propiedades ?? []);
  protected readonly selectedProperty = computed(
    () =>
      this.properties().find((property) => property.codprop === this.selectedPropertyId()) ?? null,
  );
  protected readonly visibleProperties = computed(() => {
    if (this.viewMode() === 'general') {
      return this.properties();
    }

    const selectedProperty = this.selectedProperty();
    return selectedProperty ? [selectedProperty] : [];
  });
  protected readonly monthlySeries = computed<readonly DashboardIngresoMensual[]>(() => {
    if (this.viewMode() === 'propiedad') {
      return this.selectedProperty()?.ingresosConfirmadosPorMes ?? [];
    }

    return this.report()?.ingresosConfirmadosPorMes ?? [];
  });
  protected readonly investmentAmount = computed(() => {
    if (this.viewMode() === 'propiedad') {
      return this.selectedProperty()?.inversionInicial ?? 0;
    }

    return this.report()?.resumenGeneral.inversionInicialTotal ?? 0;
  });
  protected readonly confirmedIncomeAmount = computed(() => {
    if (this.viewMode() === 'propiedad') {
      return this.selectedProperty()?.ingresosConfirmadosAcumulados ?? 0;
    }

    return this.report()?.resumenGeneral.ingresosConfirmadosAcumulados ?? 0;
  });
  protected readonly recoveryPercentage = computed(() => {
    if (this.viewMode() === 'propiedad') {
      return this.selectedProperty()?.porcentajeRecuperacion ?? null;
    }

    return this.report()?.resumenGeneral.porcentajeRecuperacion ?? null;
  });
  protected readonly scopeLabel = computed(() =>
    this.viewMode() === 'general'
      ? 'Todas tus propiedades'
      : (this.selectedProperty()?.nombre ?? 'Selecciona una propiedad'),
  );
  protected readonly noProperties = computed(
    () => this.report() !== null && this.properties().length === 0,
  );
  protected readonly hasNoConfirmedIncome = computed(
    () => this.report() !== null && this.confirmedIncomeAmount() === 0,
  );

  constructor() {
    this.loadDashboard();
  }

  protected loadDashboard(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.api
      .getResumenFinanciero()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (report) => {
          this.report.set(report);
          this.selectedPropertyId.set(report.propiedades[0]?.codprop ?? null);
        },
        error: (error: unknown) => this.loadError.set(this.resolveLoadError(error)),
      });
  }

  protected selectViewMode(mode: DashboardViewMode): void {
    this.viewMode.set(mode);

    if (mode === 'propiedad' && this.selectedPropertyId() === null) {
      this.selectedPropertyId.set(this.properties()[0]?.codprop ?? null);
    }
  }

  protected selectPropertyFromControl(event: Event): void {
    const selectedId = Number((event.target as HTMLSelectElement).value);

    if (this.properties().some((property) => property.codprop === selectedId)) {
      this.selectedPropertyId.set(selectedId);
    }
  }

  protected showProperty(propertyId: number): void {
    this.selectedPropertyId.set(propertyId);
    this.viewMode.set('propiedad');
  }

  protected formatAmount(amount: number): string {
    return formatDashboardAmount(amount);
  }

  protected formatPercent(percent: number | null): string {
    return formatDashboardPercent(percent);
  }

  protected isPropertySelected(property: DashboardPropiedadFinanciera): boolean {
    return this.viewMode() === 'propiedad' && this.selectedPropertyId() === property.codprop;
  }

  private resolveLoadError(error: unknown): DashboardLoadError {
    if (!(error instanceof HttpErrorResponse)) {
      return 'general';
    }

    if (error.status === 401) {
      return 'session';
    }

    if (error.status === 403) {
      return 'forbidden';
    }

    return 'general';
  }
}
