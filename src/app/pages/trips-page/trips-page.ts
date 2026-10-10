import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Temporal } from '@js-temporal/polyfill';
import { Header } from '../../sections/header/header';

@Component({
  imports: [Header],
  selector: 'app-trips-page',
  styleUrl: './trips-page.scss',
  templateUrl: './trips-page.html',
})
export class TripsPage {
  private readonly params = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });
  protected readonly from = computed(() => this.params().get('from') ?? '');
  protected readonly to = computed(() => this.params().get('to') ?? '');
  protected readonly date = computed(() => this.params().get('date') ?? '');
  protected readonly complete = computed(() => Boolean(this.from() && this.to() && this.date()));
  protected readonly dateLabel = computed(() => {
    try {
      return Temporal.PlainDate.from(this.date()).toLocaleString('pt-BR', { dateStyle: 'long' });
    } catch {
      return this.date();
    }
  });
}
