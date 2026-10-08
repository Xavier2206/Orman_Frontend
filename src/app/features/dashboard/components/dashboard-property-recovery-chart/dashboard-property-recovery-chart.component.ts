import { Component, computed, input, output } from '@angular/core';

import { formatDashboardPercent } from '../../models/dashboard-financiero-format';
import { DashboardPropiedadFinanciera } from '../../models/dashboard-financiero.model';

interface PropertyRecoveryRow {
  readonly property: DashboardPropiedadFinanciera;
  readonly barWidth: number;
  readonly isCalculable: boolean;
}

@Component({
  selector: 'app-dashboard-property-recovery-chart',
  templateUrl: './dashboard-property-recovery-chart.component.html',
  styleUrl: './dashboard-property-recovery-chart.component.css',
})
export class DashboardPropertyRecoveryChartComponent {
  readonly properties = input.required<readonly DashboardPropiedadFinanciera[]>();
  readonly propertySelected = output<number>();

  protected readonly maxScale = computed(() =>
    Math.max(
      100,
      ...this.properties()
        .filter((property) => property.inversionInicial > 0)
        .map((property) => property.porcentajeRecuperacion)
        .filter(
          (percentage): percentage is number => percentage !== null && Number.isFinite(percentage),
        ),
    ),
  );
  protected readonly rows = computed<readonly PropertyRecoveryRow[]>(() => {
    const scalePercent = this.maxScale();

    return this.properties()
      .map((property) => {
        const percentage = property.porcentajeRecuperacion;
        const isCalculable =
          property.inversionInicial > 0 && percentage !== null && Number.isFinite(percentage);

        return {
          property,
          isCalculable,
          barWidth:
            !isCalculable || percentage === null || !Number.isFinite(percentage) || percentage <= 0
              ? 0
              : Math.min((percentage / scalePercent) * 100, 100),
        };
      })
      .sort((first, second) => {
        if (first.isCalculable !== second.isCalculable) {
          return first.isCalculable ? -1 : 1;
        }

        if (!first.isCalculable || !second.isCalculable) {
          return 0;
        }

        return (
          (second.property.porcentajeRecuperacion ?? 0) -
          (first.property.porcentajeRecuperacion ?? 0)
        );
      });
  });

  protected formatPercent(percent: number | null, investmentAmount: number): string {
    if (investmentAmount <= 0) {
      return 'No calculable';
    }

    return formatDashboardPercent(percent);
  }

  protected selectProperty(propertyId: number): void {
    this.propertySelected.emit(propertyId);
  }
}
