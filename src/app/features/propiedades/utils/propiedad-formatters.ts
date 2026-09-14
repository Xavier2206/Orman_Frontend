const BOLIVIAN_CURRENCY_FORMATTER = new Intl.NumberFormat('es-BO', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});
const OCCUPANCY_FORMATTER = new Intl.NumberFormat('es-BO', {
  maximumFractionDigits: 2,
});

export function formatPropiedadInvestment(value: number): string {
  return 'Bs ' + BOLIVIAN_CURRENCY_FORMATTER.format(value);
}

export function formatPropiedadOccupancy(value: number): string {
  return `${OCCUPANCY_FORMATTER.format(value)}%`;
}
