import { describe, expect, it, vi } from 'vitest';

vi.mock('ngx-sonner', () => ({
  toast: {
    dismiss: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

import { toast } from 'ngx-sonner';

import { OrmanNotificationService } from './orman-notification.service';

describe('OrmanNotificationService', () => {
  it('encapsulates success notifications with the ORMAN duration', () => {
    const notification = new OrmanNotificationService();

    notification.success('Persona creada correctamente.');

    expect(toast.success).toHaveBeenCalledWith(
      'Persona creada correctamente.',
      expect.objectContaining({
        closeButton: true,
        duration: 5000,
        important: false,
      }),
    );
  });

  it('keeps action-required warnings and errors visible until dismissal', () => {
    const notification = new OrmanNotificationService();

    notification.warning('Revisa la información.');
    notification.error('No fue posible guardar.');

    expect(toast.warning).toHaveBeenCalledWith(
      'Revisa la información.',
      expect.objectContaining({
        closeButton: true,
        duration: Number.POSITIVE_INFINITY,
        important: true,
      }),
    );
    expect(toast.error).toHaveBeenCalledWith(
      'No fue posible guardar.',
      expect.objectContaining({
        closeButton: true,
        duration: Number.POSITIVE_INFINITY,
        important: true,
      }),
    );
  });

  it('delegates programmatic dismissal to ngx-sonner', () => {
    const notification = new OrmanNotificationService();

    notification.dismiss('persona-created');

    expect(toast.dismiss).toHaveBeenCalledWith('persona-created');
  });
});
