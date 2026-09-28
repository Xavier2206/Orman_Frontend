import { describe, expect, it } from 'vitest';

import { pagosRoutes } from './pagos.routes';

describe('pagosRoutes', () => {
  it('registers the QR de cobro process path', () => {
    expect(pagosRoutes.some((route) => route.path === 'qr-cobro')).toBe(true);
  });
});
