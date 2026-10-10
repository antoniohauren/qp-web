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
  {
    path: 'assentos',
    loadComponent: () => import('./pages/seats-page/seats-page').then(({ SeatsPage }) => SeatsPage),
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./pages/checkout-page/checkout-page').then(({ CheckoutPage }) => CheckoutPage),
  },
];
