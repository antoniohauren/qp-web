import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Temporal } from '@js-temporal/polyfill';
import { Header } from '../../sections/header/header';

@Component({
  imports: [Header, RouterLink],
  selector: 'app-checkout-page',
  styleUrl: './checkout-page.scss',
  templateUrl: './checkout-page.html',
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
