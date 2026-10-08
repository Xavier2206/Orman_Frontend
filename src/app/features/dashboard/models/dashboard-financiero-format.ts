const NUMBER_FORMATTER = new Intl.NumberFormat('es-BO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PERCENT_FORMATTER = new Intl.NumberFormat('es-BO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatDashboardAmount(amount: number): string {
  if (!Number.isFinite(amount)) {
    return '—';
  }

  return `Bs ${NUMBER_FORMATTER.format(amount)}`;
}

export function formatDashboardPercent(percent: number | null): string {
  if (percent === null || !Number.isFinite(percent)) {
    return 'No calculable';
  }

  return `${PERCENT_FORMATTER.format(percent)} %`;
}

export function formatDashboardPeriod(period: string, includeYear = true): string {
  const [year, month] = period.split('-').map(Number);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return period;
  }

  const date = new Date(year, month - 1, 15, 12);

  return new Intl.DateTimeFormat('es-BO', {
    month: 'short',
    ...(includeYear ? { year: 'numeric' as const } : {}),
  })
    .format(date)
    .replace(/\.$/, '');
}
