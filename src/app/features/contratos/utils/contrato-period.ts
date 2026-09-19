export interface ContratoPeriodPreview {
  readonly fechaInicio: string;
  readonly fechaFin: string;
  readonly fechaFinDisplay: string;
  readonly inicioLabel: string;
  readonly finLabel: string;
  readonly ultimaCuotaLabel: string;
  readonly cuotas: number;
}

const ALLOWED_DURATIONS = new Set([1, 6, 12, 24]);

export function buildContratoPeriodPreview(
  startMonth: string,
  durationMonths: number,
): ContratoPeriodPreview | null {
  const match = /^([0-9]{4})-(0[1-9]|1[0-2])$/.exec(startMonth);

  if (!match || !ALLOWED_DURATIONS.has(durationMonths)) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + durationMonths, 1));
  const lastInstallment = new Date(Date.UTC(year, month + durationMonths - 1, 1));

  return {
    fechaInicio: formatIsoDate(start),
    fechaFin: formatIsoDate(end),
    fechaFinDisplay: formatDisplayDate(end),
    inicioLabel: formatMonth(start),
    finLabel: formatMonth(end),
    ultimaCuotaLabel: formatMonth(lastInstallment),
    cuotas: durationMonths,
  };
}

function formatIsoDate(value: Date): string {
  const year = value.getUTCFullYear();
  const month = `${value.getUTCMonth() + 1}`.padStart(2, '0');

  return `${year}-${month}-01`;
}

function formatDisplayDate(value: Date): string {
  const day = `${value.getUTCDate()}`.padStart(2, '0');
  const month = `${value.getUTCMonth() + 1}`.padStart(2, '0');

  return `${day}/${month}/${value.getUTCFullYear()}`;
}

function formatMonth(value: Date): string {
  const month = new Intl.DateTimeFormat('es-BO', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(value);

  const compactMonth = month.replace(' de ', ' ');

  return compactMonth.charAt(0).toLocaleUpperCase('es-BO') + compactMonth.slice(1);
}
