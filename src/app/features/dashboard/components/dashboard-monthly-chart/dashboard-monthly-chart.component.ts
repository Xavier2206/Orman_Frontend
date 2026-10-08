import { Component, computed, input } from '@angular/core';

import {
  formatDashboardAmount,
  formatDashboardPeriod,
} from '../../models/dashboard-financiero-format';
import { DashboardIngresoMensual } from '../../models/dashboard-financiero.model';

interface MonthlyChartPoint extends DashboardIngresoMensual {
  readonly x: number;
  readonly y: number;
  readonly monthLabel: string;
  readonly fullPeriodLabel: string;
}

interface MonthlyChartTick {
  readonly value: number;
  readonly y: number;
}

const CHART_WIDTH = 800;
const CHART_HEIGHT = 340;
const CHART_LEFT = 84;
const CHART_RIGHT = 18;
const CHART_TOP = 28;
const CHART_BOTTOM = 62;
const TICK_COUNT = 5;

@Component({
  selector: 'app-dashboard-monthly-chart',
  templateUrl: './dashboard-monthly-chart.component.html',
  styleUrl: './dashboard-monthly-chart.component.css',
})
export class DashboardMonthlyChartComponent {
  readonly series = input.required<readonly DashboardIngresoMensual[]>();
  readonly scopeLabel = input.required<string>();

  protected readonly plotBottom = CHART_HEIGHT - CHART_BOTTOM;
  protected readonly maximumAmount = computed(() =>
    Math.max(0, ...this.series().map((point) => this.safeAmount(point.monto))),
  );
  protected readonly scaleMax = computed(() => this.getScaleMax(this.maximumAmount()));
  protected readonly ticks = computed<readonly MonthlyChartTick[]>(() => {
    const max = this.scaleMax();

    if (max === 0) {
      return [{ value: 0, y: this.plotBottom }];
    }

    return Array.from({ length: TICK_COUNT + 1 }, (_, index) => ({
      value: max - (max / TICK_COUNT) * index,
      y: CHART_TOP + ((this.plotBottom - CHART_TOP) / TICK_COUNT) * index,
    }));
  });
  protected readonly points = computed<readonly MonthlyChartPoint[]>(() => {
    const monthlyIncome = this.series();
    const maxAmount = this.scaleMax();
    const plotWidth = CHART_WIDTH - CHART_LEFT - CHART_RIGHT;
    const plotHeight = this.plotBottom - CHART_TOP;
    const denominator = Math.max(monthlyIncome.length - 1, 1);

    return monthlyIncome.map((point, index) => {
      const amount = this.safeAmount(point.monto);
      const x =
        monthlyIncome.length === 1
          ? CHART_LEFT + plotWidth / 2
          : CHART_LEFT + (index / denominator) * plotWidth;
      const y =
        maxAmount === 0
          ? this.plotBottom
          : CHART_TOP + plotHeight - (amount / maxAmount) * plotHeight;
      const [year] = point.periodo.split('-');

      return {
        ...point,
        x,
        y,
        monthLabel: `${formatDashboardPeriod(point.periodo, false)} '${year?.slice(-2) ?? ''}`,
        fullPeriodLabel: formatDashboardPeriod(point.periodo),
      };
    });
  });
  protected readonly polylinePoints = computed(() =>
    this.points()
      .map((point) => `${point.x},${point.y}`)
      .join(' '),
  );
  protected readonly areaPoints = computed(() => {
    const points = this.points();

    if (points.length === 0) {
      return '';
    }

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    return [
      `${firstPoint.x},${this.plotBottom}`,
      ...points.map((point) => `${point.x},${point.y}`),
      `${lastPoint.x},${this.plotBottom}`,
    ].join(' ');
  });
  protected readonly noMonthlyIncome = computed(
    () =>
      this.series().length > 0 &&
      this.series().every((point) => this.safeAmount(point.monto) === 0),
  );

  protected formatAmount(amount: number): string {
    return formatDashboardAmount(amount);
  }

  protected formatPeriod(period: string): string {
    return formatDashboardPeriod(period);
  }

  private safeAmount(amount: number): number {
    return Number.isFinite(amount) ? Math.max(amount, 0) : 0;
  }

  private getScaleMax(maxAmount: number): number {
    if (maxAmount <= 0) {
      return 0;
    }

    const rawStep = maxAmount / TICK_COUNT;
    const magnitude = 10 ** Math.floor(Math.log10(rawStep));
    const normalizedStep = rawStep / magnitude;
    const stepMultiplier =
      normalizedStep <= 1 ? 1 : normalizedStep <= 2 ? 2 : normalizedStep <= 5 ? 5 : 10;
    const step = stepMultiplier * magnitude;

    return Math.ceil(maxAmount / step) * step;
  }
}
