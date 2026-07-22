import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/public/landing/landing.component').then(
        (component) => component.LandingComponent,
      ),
  },
];
