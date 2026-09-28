import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isQrCobroDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export const qrCobroDateValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  if (control.value === '') {
    return null;
  }

  return isQrCobroDate(control.value) ? null : { dateFormat: true };
};

export const qrCobroDateRangeValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const start = control.get('fechaInicio')?.value;
  const end = control.get('fechaFin')?.value;

  if (!isQrCobroDate(start) || !isQrCobroDate(end)) {
    return null;
  }

  return end < start ? { dateRange: true } : null;
};
