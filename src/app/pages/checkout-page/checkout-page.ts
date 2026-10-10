import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Temporal } from '@js-temporal/polyfill';
import { Header } from '../../sections/header/header';

@Component({
  imports: [Header, RouterLink],
  selector: 'app-checkout-page',
  template: `
    <app-header />

    <main>
      <header class="page-heading">
        <h1>Revise sua viagem</h1>
        <p>Nenhuma cobrança será realizada nesta página.</p>
      </header>

      @if (complete()) {
        <div class="checkout-grid">
          <section class="trip-card" aria-labelledby="trip-heading">
            <p class="card-label">Seu itinerário</p>
            <h2 id="trip-heading">{{ from() }} <span>para</span> {{ to() }}</h2>
            <dl>
              <div>
                <dt>Embarque</dt>
                <dd>{{ departure() }}</dd>
              </div>
              <div>
                <dt>Empresa</dt>
                <dd>{{ company() }}</dd>
              </div>
              <div>
                <dt>Categoria</dt>
                <dd>{{ seatClass() }}</dd>
              </div>
            </dl>
          </section>

          <aside class="order-card" aria-labelledby="order-heading">
            <p class="card-label">Resumo</p>
            <h2 id="order-heading">{{ seats().length }} passagem(ns)</h2>
            <div class="seat-list" aria-label="Assentos selecionados">
              @for (seat of seats(); track seat) {
                <span>{{ seat }}</span>
              }
            </div>
            <div class="total">
              <span>Total</span><strong>{{ total() }}</strong>
            </div>
            <button type="button" (click)="finished.set(true)">Finalizar compra</button>
            @if (finished()) {
              <p class="success" role="status">
                Reserva simulada com sucesso. Nenhum pagamento foi feito.
              </p>
            }
          </aside>
        </div>
      } @else {
        <section class="empty" role="alert">
          <h2>Checkout vazio</h2>
          <p>Escolha uma viagem e seus assentos antes de continuar.</p>
          <a routerLink="/">Buscar passagens</a>
        </section>
      }
    </main>
  `,
  styles: `
    :host {
      display: block;
    }
    main {
      box-sizing: border-box;
      max-width: 960px;
      margin: 0 auto;
      padding: 44px 24px 80px;
    }
    .page-heading {
      max-width: 620px;
      margin: 28px 0 32px;
    }
    .card-label {
      margin: 0;
      color: var(--mat-sys-primary);
      font: var(--mat-sys-label-small);
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    h1 {
      margin: 7px 0 10px;
      font: var(--mat-sys-display-small);
      font-weight: 700;
      letter-spacing: -0.04em;
    }
    .page-heading > p:last-child {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-large);
    }
    .checkout-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.8fr);
      gap: 20px;
      align-items: start;
    }
    .trip-card,
    .order-card,
    .empty {
      padding: 28px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 20px;
      background: var(--mat-sys-surface-container-lowest);
      box-shadow: 0 12px 34px color-mix(in srgb, var(--mat-sys-primary) 8%, transparent);
    }
    h2 {
      margin: 9px 0 24px;
      font: var(--mat-sys-headline-small);
      font-weight: 700;
      letter-spacing: -0.03em;
    }
    h2 span {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-title-medium);
    }
    dl {
      margin: 0;
    }
    dl div {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      padding: 16px 0;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }
    dt {
      color: var(--mat-sys-on-surface-variant);
    }
    dd {
      margin: 0;
      font-weight: 700;
      text-align: right;
    }
    .seat-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .seat-list span {
      display: grid;
      width: 42px;
      height: 42px;
      border-radius: 11px 11px 7px 7px;
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      font-weight: 800;
      place-items: center;
    }
    .total {
      display: flex;
      justify-content: space-between;
      margin: 24px 0 18px;
      padding-top: 18px;
      border-top: 1px solid var(--mat-sys-outline-variant);
      font: var(--mat-sys-title-medium);
    }
    .total strong {
      color: var(--mat-sys-primary);
    }
    button,
    .empty a {
      display: grid;
      box-sizing: border-box;
      width: 100%;
      min-height: 50px;
      padding: 0 20px;
      border: 0;
      border-radius: 14px;
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      font: var(--mat-sys-label-large);
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      place-items: center;
    }
    button:focus-visible,
    a:focus-visible {
      outline: 3px solid var(--mat-sys-primary);
      outline-offset: 3px;
    }
    .success {
      margin: 16px 0 0;
      padding: 12px;
      border-radius: 10px;
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
      font-weight: 600;
    }
    .empty {
      max-width: 520px;
    }
    .empty p {
      color: var(--mat-sys-on-surface-variant);
    }
    .empty a {
      width: fit-content;
      margin-top: 20px;
    }
    @media (max-width: 720px) {
      main {
        padding: 28px 16px 56px;
      }
      .checkout-grid {
        grid-template-columns: 1fr;
      }
      .trip-card,
      .order-card {
        padding: 22px;
      }
      dl div {
        display: block;
      }
      dd {
        margin-top: 4px;
        text-align: left;
      }
    }
  `,
})
export class CheckoutPage {
  private readonly params = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });
  private readonly formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  protected readonly from = computed(() => this.params().get('from') ?? '');
  protected readonly to = computed(() => this.params().get('to') ?? '');
  protected readonly departure = computed(() => {
    const value = this.params().get('departure');
    if (!value) return '';

    try {
      return Temporal.PlainDateTime.from(value).toLocaleString('pt-BR', {
        dateStyle: 'long',
        timeStyle: 'short',
      });
    } catch {
      return value.replace('T', ' ');
    }
  });
  protected readonly company = computed(() => this.params().get('company') ?? '');
  protected readonly seatClass = computed(() => this.params().get('seatClass') ?? '');
  protected readonly seats = computed(
    () => this.params().get('seats')?.split(',').filter(Boolean) ?? [],
  );
  protected readonly complete = computed(() =>
    Boolean(this.from() && this.to() && this.seats().length),
  );
  protected readonly total = computed(() =>
    this.formatter.format(Number(this.params().get('price') ?? 0) * this.seats().length),
  );
  protected readonly finished = signal(false);
}
