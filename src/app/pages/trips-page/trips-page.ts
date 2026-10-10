import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Temporal } from '@js-temporal/polyfill';
import { Header } from '../../sections/header/header';
import { Trip, TripsService } from '../../services/trips.service';

@Component({
  imports: [Header, RouterLink],
  selector: 'app-trips-page',
  styleUrl: './trips-page.scss',
  templateUrl: './trips-page.html',
})
export class TripsPage {
  private readonly params = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });
  private readonly priceFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  private readonly tripsService = inject(TripsService);
  protected readonly from = computed(() => this.params().get('from') ?? '');
  protected readonly to = computed(() => this.params().get('to') ?? '');
  protected readonly date = computed(() => this.params().get('date') ?? '');
  protected readonly complete = computed(() => Boolean(this.from() && this.to() && this.date()));
  protected readonly trips = signal<Trip[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadError = signal(false);
  protected readonly dateLabel = computed(() => {
    try {
      return Temporal.PlainDate.from(this.date()).toLocaleString('pt-BR', { dateStyle: 'long' });
    } catch {
      return this.date();
    }
  });

  constructor() {
    effect((onCleanup) => {
      if (!this.complete()) return;

      this.loading.set(true);
      this.loadError.set(false);
      this.trips.set([]);
      const request = this.tripsService.getTrips(this.from(), this.to(), this.date()).subscribe({
        next: (trips) => this.trips.set(trips),
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
        complete: () => this.loading.set(false),
      });
      onCleanup(() => request.unsubscribe());
    });
  }

  protected formatDateTime({ date, time }: Trip['departure']) {
    const dateLabel = Temporal.PlainDate.from(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
    return `${time.slice(0, 5)} · ${dateLabel}`;
  }

  protected formatDuration(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes.toString().padStart(2, '0')}min`;
  }

  protected formatPrice(price: number) {
    return this.priceFormatter.format(price);
  }
}
