import { describe, expect, it } from 'vitest';

import { buildContratoPeriodPreview } from './contrato-period';

describe('buildContratoPeriodPreview', () => {
  it('calculates first-day boundaries and monthly installments for a one-year contract', () => {
    expect(buildContratoPeriodPreview('2026-10', 12)).toEqual({
      fechaInicio: '2026-10-01',
      fechaFin: '2027-10-01',
      fechaFinDisplay: '01/10/2027',
      inicioLabel: 'Octubre 2026',
      finLabel: 'Octubre 2027',
      ultimaCuotaLabel: 'Septiembre 2027',
      cuotas: 12,
    });
  });

  it('supports the available duration options across a year boundary', () => {
    expect(buildContratoPeriodPreview('2026-12', 1)?.fechaFin).toBe('2027-01-01');
    expect(buildContratoPeriodPreview('2026-12', 6)?.ultimaCuotaLabel).toBe('Mayo 2027');
    expect(buildContratoPeriodPreview('2026-12', 24)?.cuotas).toBe(24);
  });

  it('rejects invalid months and unsupported durations', () => {
    expect(buildContratoPeriodPreview('2026-13', 12)).toBeNull();
    expect(buildContratoPeriodPreview('2026-10', 3)).toBeNull();
  });
});
