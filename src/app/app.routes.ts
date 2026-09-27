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
        path: 'propiedades/listar',
        loadComponent: () =>
          import('./features/propiedades/pages/propiedades-list/propiedades-list.component').then(
            (component) => component.PropiedadesListComponent,
          ),
      },
      {
        path: 'propiedades/nueva',
        loadComponent: () =>
          import('./features/propiedades/pages/propiedad-form/propiedad-form.component').then(
            (component) => component.PropiedadFormComponent,
          ),
      },
      {
        path: 'propiedades/:codprop/editar',
        loadComponent: () =>
          import('./features/propiedades/pages/propiedad-form/propiedad-form.component').then(
            (component) => component.PropiedadFormComponent,
          ),
      },
      {
        path: 'propiedades/:codprop/detalle',
        loadComponent: () =>
          import('./features/propiedades/pages/propiedad-detail/propiedad-detail.component').then(
            (component) => component.PropiedadDetailComponent,
          ),
      },
      {
        path: 'unidades/listar',
        loadComponent: () =>
          import('./features/unidades/pages/unidades-list/unidades-list.component').then(
            (component) => component.UnidadesListComponent,
          ),
      },
      {
        path: 'unidades/nueva',
        loadComponent: () =>
          import('./features/unidades/pages/unidad-form/unidad-form.component').then(
            (component) => component.UnidadFormComponent,
          ),
      },
      {
        path: 'unidades/:coduni/editar',
        loadComponent: () =>
          import('./features/unidades/pages/unidad-form/unidad-form.component').then(
            (component) => component.UnidadFormComponent,
          ),
      },
      {
        path: 'unidades/:coduni/detalle',
        loadComponent: () =>
          import('./features/unidades/pages/unidad-detail/unidad-detail.component').then(
            (component) => component.UnidadDetailComponent,
          ),
      },
      {
        path: 'contratos/nuevo',
        loadComponent: () =>
          import('./features/contratos/pages/contrato-create/contrato-create.component').then(
            (component) => component.ContratoCreateComponent,
          ),
      },
      {
        path: 'contratos/:codcon/detalle',
        loadComponent: () =>
          import('./features/contratos/pages/contrato-detail/contrato-detail.component').then(
            (component) => component.ContratoDetailComponent,
          ),
      },
      {
        path: 'contratos/listar',
        loadComponent: () =>
          import('./features/contratos/pages/contratos-list/contratos-list.component').then(
            (component) => component.ContratosListComponent,
          ),
      },
      {
        path: 'pagos',
        loadChildren: () =>
          import('./features/pagos/pagos.routes').then((feature) => feature.pagosRoutes),
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
      {
        path: 'asignar-menus/listar',
        loadComponent: () =>
          import('./features/asignar-menus/pages/asignar-menus-list/asignar-menus-list.component').then(
            (component) => component.AsignarMenusListComponent,
          ),
      },
      {
        path: 'asignar-procesos/listar',
        loadComponent: () =>
          import('./features/asignar-procesos/pages/asignar-procesos-list/asignar-procesos-list.component').then(
            (component) => component.AsignarProcesosListComponent,
          ),
      },
    ],
  },
];
