import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Buscar passagens | Quero Passagem',
    loadComponent: () => import('./pages/home-page/home-page').then(({ HomePage }) => HomePage),
  },
  {
    path: 'passagens',
    title: 'Resultados da busca de passagens | Quero Passagem',
    loadComponent: () => import('./pages/trips-page/trips-page').then(({ TripsPage }) => TripsPage),
  },
  {
    path: 'assentos',
    title: 'Selecionar assentos | Quero Passagem',
    loadComponent: () => import('./pages/seats-page/seats-page').then(({ SeatsPage }) => SeatsPage),
  },
  {
    path: 'checkout',
    title: 'Finalizar compra | Quero Passagem',
    loadComponent: () =>
      import('./pages/checkout-page/checkout-page').then(({ CheckoutPage }) => CheckoutPage),
  },
];
