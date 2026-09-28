import { FormControl, FormGroup, Validators } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import { qrCobroDateRangeValidator, qrCobroDateValidator } from './qr-cobro-date.validators';

describe('QR de cobro date validators', () => {
  it('accepts real ISO dates and rejects invalid formats and calendar dates', () => {
    const validDate = new FormControl('2026-09-26', {
      nonNullable: true,
      validators: [Validators.required, qrCobroDateValidator],
    });
    const invalidFormat = new FormControl('26/09/2026', {
      nonNullable: true,
      validators: [Validators.required, qrCobroDateValidator],
    });
    const invalidDay = new FormControl('2026-02-30', {
      nonNullable: true,
      validators: [Validators.required, qrCobroDateValidator],
    });

    expect(validDate.valid).toBe(true);
    expect(invalidFormat.hasError('dateFormat')).toBe(true);
    expect(invalidDay.hasError('dateFormat')).toBe(true);
  });

  it('rejects a range whose end date is before the start date', () => {
    const form = new FormGroup(
      {
        fechaInicio: new FormControl('2026-09-27', { nonNullable: true }),
        fechaFin: new FormControl('2026-09-26', { nonNullable: true }),
      },
      { validators: qrCobroDateRangeValidator },
    );

    expect(form.hasError('dateRange')).toBe(true);
  });
});
