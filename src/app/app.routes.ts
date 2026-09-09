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
          import('./features/inicio/inicio.component').then(
            (component) => component.InicioComponent,
          ),
      },
      {
        path: 'personas/listar',
        loadComponent: () =>
          import('./features/personas/pages/personas-list/personas-list.component').then(
            (component) => component.PersonasListComponent,
          ),
      },
      {
        path: 'roles/listar',
        loadComponent: () =>
          import('./features/roles/pages/roles-list/roles-list.component').then(
            (component) => component.RolesListComponent,
          ),
      },
      {
        path: 'menus/listar',
        loadComponent: () =>
          import('./features/menus/pages/menus-list/menus-list.component').then(
            (component) => component.MenusListComponent,
          ),
      },
      {
        path: 'asignar-roles/listar',
        loadComponent: () =>
          import('./features/asignar-roles/pages/asignar-roles-list/asignar-roles-list.component').then(
            (component) => component.AsignarRolesListComponent,
          ),
      },
    ],
  },
];
