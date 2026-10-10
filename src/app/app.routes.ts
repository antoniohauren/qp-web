import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home-page/home-page').then(({ HomePage }) => HomePage),
  },
  {
    path: 'passagens',
    loadComponent: () => import('./pages/trips-page/trips-page').then(({ TripsPage }) => TripsPage),
  },
];
