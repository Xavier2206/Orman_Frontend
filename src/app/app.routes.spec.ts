import { authGuard } from './core/auth/auth.guard';
import { routes } from './app.routes';

describe('application routes', () => {
  it('registers the financial dashboard under the authenticated private area', () => {
    const privateRoute = routes.find((route) => route.path === 'app');
    const dashboardRoute = privateRoute?.children?.find(
      (route) => route.path === 'dashboard/resumen-financiero',
    );

    expect(privateRoute?.canActivate).toContain(authGuard);
    expect(dashboardRoute?.loadComponent).toBeTypeOf('function');
  });
});
