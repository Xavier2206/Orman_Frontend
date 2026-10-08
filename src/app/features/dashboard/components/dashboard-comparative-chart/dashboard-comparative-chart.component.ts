import { Component, computed, input, output } from '@angular/core';

import { formatDashboardAmount } from '../../models/dashboard-financiero-format';
import { DashboardPropiedadFinanciera } from '../../models/dashboard-financiero.model';

interface ComparativeChartTick {
  readonly value: number;
  readonly y: number;
}

interface ComparativeChartRow {
  readonly property: DashboardPropiedadFinanciera;
  readonly centerX: number;
  readonly investmentX: number;
  readonly investmentY: number;
  readonly investmentHeight: number;
  readonly incomeX: number;
  readonly incomeY: number;
  readonly incomeHeight: number;
  readonly labelLines: readonly string[];
}

const CHART_HEIGHT = 360;
const CHART_LEFT = 96;
const CHART_RIGHT = 24;
const CHART_TOP = 24;
const CHART_BOTTOM = 88;
const MIN_CHART_WIDTH = 720;
const CATEGORY_WIDTH = 156;
const BAR_GAP = 8;
const TICK_COUNT = 5;

@Component({
  selector: 'app-dashboard-comparative-chart',
  templateUrl: './dashboard-comparative-chart.component.html',
  styleUrl: './dashboard-comparative-chart.component.css',
})
export class DashboardComparativeChartComponent {
  readonly properties = input.required<readonly DashboardPropiedadFinanciera[]>();
  readonly scopeLabel = input.required<string>();
  readonly propertySelected = output<number>();

  protected readonly plotBottom = CHART_HEIGHT - CHART_BOTTOM;
  protected readonly chartWidth = computed(() =>
    Math.max(MIN_CHART_WIDTH, this.properties().length * CATEGORY_WIDTH + CHART_LEFT + CHART_RIGHT),
  );
  protected readonly plotWidth = computed(() => this.chartWidth() - CHART_LEFT - CHART_RIGHT);
  protected readonly maxAmount = computed(() =>
    Math.max(
      0,
      ...this.properties().flatMap((property) => [
        this.safeAmount(property.inversionInicial),
        this.safeAmount(property.ingresosConfirmadosAcumulados),
      ]),
    ),
  );
  protected readonly scaleMax = computed(() => this.getScaleMax(this.maxAmount()));
  protected readonly ticks = computed<readonly ComparativeChartTick[]>(() => {
    const max = this.scaleMax();

    if (max === 0) {
      return [{ value: 0, y: this.plotBottom }];
    }

    return Array.from({ length: TICK_COUNT + 1 }, (_, index) => {
      const value = max - (max / TICK_COUNT) * index;
      const y = CHART_TOP + ((this.plotBottom - CHART_TOP) / TICK_COUNT) * index;

      return { value, y };
    });
  });
  protected readonly rows = computed<readonly ComparativeChartRow[]>(() => {
    const properties = this.properties();
    const categoryWidth = this.plotWidth() / Math.max(properties.length, 1);
    const barWidth = Math.max(14, Math.min(38, categoryWidth * 0.24));
    const max = this.scaleMax();
    const plotHeight = this.plotBottom - CHART_TOP;

    return properties.map((property, index) => {
      const centerX = CHART_LEFT + categoryWidth * (index + 0.5);
      const investmentHeight = this.getBarHeight(property.inversionInicial, max, plotHeight);
      const incomeHeight = this.getBarHeight(
        property.ingresosConfirmadosAcumulados,
        max,
        plotHeight,
      );

      return {
        property,
        centerX,
        investmentX: centerX - BAR_GAP / 2 - barWidth,
        investmentY: this.plotBottom - investmentHeight,
        investmentHeight,
        incomeX: centerX + BAR_GAP / 2,
        incomeY: this.plotBottom - incomeHeight,
        incomeHeight,
        labelLines: this.getAxisLabelLines(property.nombre),
      };
    });
  });

  protected formatAmount(amount: number): string {
    return formatDashboardAmount(amount);
  }

  protected selectProperty(propertyId: number): void {
    this.propertySelected.emit(propertyId);
  }

  protected onBarGroupKeydown(event: KeyboardEvent, propertyId: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectProperty(propertyId);
    }
  }

  private safeAmount(amount: number): number {
    return Number.isFinite(amount) ? Math.max(0, amount) : 0;
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

  private getBarHeight(amount: number, scaleMax: number, plotHeight: number): number {
    if (scaleMax <= 0) {
      return 0;
    }

    return (this.safeAmount(amount) / scaleMax) * plotHeight;
  }

  private getAxisLabelLines(name: string): string[] {
    const words = name.trim().replace(/\s+/g, ' ').split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (let index = 0; index < words.length; index += 1) {
      const word = words[index];
      const candidate = currentLine ? `${currentLine} ${word}` : word;

      if (candidate.length <= 17) {
        currentLine = candidate;
        continue;
      }

      if (!currentLine) {
        lines.push(`${word.slice(0, 16)}…`);
        break;
      }

      lines.push(currentLine);
      currentLine = word;

      if (lines.length === 2 && index < words.length - 1) {
        const visibleLine =
          currentLine.length > 16 ? `${currentLine.slice(0, 16)}…` : `${currentLine}…`;
        lines.push(visibleLine);
        currentLine = '';
        break;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [''];
  }
}
