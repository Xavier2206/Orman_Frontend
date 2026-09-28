import { Routes } from '@angular/router';

export const pagosRoutes: Routes = [
  {
    path: 'qr-cobro',
    loadComponent: () =>
      import('./pages/qr-cobro/qr-cobro.component').then((component) => component.QrCobroComponent),
  },
  {
    path: 'listar',
    loadComponent: () =>
      import('./pages/pagos-list/pagos-list.component').then(
        (component) => component.PagosListComponent,
      ),
  },
];
