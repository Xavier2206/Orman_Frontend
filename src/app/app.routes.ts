import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout.component').then(
        (component) => component.PublicLayoutComponent,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/public/landing/landing.component').then(
            (component) => component.LandingComponent,
          ),
      },
    ],
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/private-layout/private-layout.component').then(
        (component) => component.PrivateLayoutComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        loadComponent: () =>
          import('./features/private/inicio/inicio.component').then(
            (component) => component.InicioComponent,
          ),
      },
    ],
  },
];
