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

  it('redirects the private root and legacy Inicio route to the financial dashboard', () => {
    const privateRoute = routes.find((route) => route.path === 'app');
    const defaultRoute = privateRoute?.children?.find((route) => route.path === '');
    const inicioRoute = privateRoute?.children?.find((route) => route.path === 'inicio');

    expect(defaultRoute?.redirectTo).toBe('dashboard/resumen-financiero');
    expect(inicioRoute?.redirectTo).toBe('dashboard/resumen-financiero');
  });
});
