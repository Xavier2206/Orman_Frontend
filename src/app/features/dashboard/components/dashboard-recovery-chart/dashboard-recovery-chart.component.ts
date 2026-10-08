import { Component, computed, input } from '@angular/core';

import {
  formatDashboardAmount,
  formatDashboardPercent,
} from '../../models/dashboard-financiero-format';

const CIRCLE_RADIUS = 48;

@Component({
  selector: 'app-dashboard-recovery-chart',
  templateUrl: './dashboard-recovery-chart.component.html',
  styleUrl: './dashboard-recovery-chart.component.css',
})
export class DashboardRecoveryChartComponent {
  readonly percentage = input.required<number | null>();
  readonly scopeLabel = input.required<string>();
  readonly investmentAmount = input.required<number>();
  readonly confirmedIncomeAmount = input.required<number>();

  protected readonly circumference = 2 * Math.PI * CIRCLE_RADIUS;
  protected readonly isCalculable = computed(() => {
    const percentage = this.percentage();
    return this.investmentAmount() > 0 && percentage !== null && Number.isFinite(percentage);
  });
  protected readonly visualPercentage = computed(() => {
    const percentage = this.percentage();

    if (!this.isCalculable() || percentage === null || !Number.isFinite(percentage)) {
      return 0;
    }

    return Math.max(0, Math.min(percentage, 100));
  });
  protected readonly dashOffset = computed(
    () => this.circumference * (1 - this.visualPercentage() / 100),
  );
  protected readonly remainingPercentage = computed(() => 100 - this.visualPercentage());
  protected readonly percentageText = computed(() =>
    this.isCalculable() ? formatDashboardPercent(this.percentage()) : 'No calculable',
  );
  protected readonly visualLimitMessage = computed(() => {
    const percentage = this.percentage();
    return this.isCalculable() && percentage !== null && percentage > 100;
  });

  protected formatAmount(amount: number): string {
    return formatDashboardAmount(amount);
  }

  protected formatPercent(percent: number): string {
    return formatDashboardPercent(percent);
  }
}
