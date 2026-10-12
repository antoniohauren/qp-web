import {
  Component,
  DOCUMENT,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { Temporal } from '@js-temporal/polyfill';
import { SeatSelector } from '../../components/seat-selector/seat-selector';
import { Header } from '../../sections/header/header';
import { Trip, TripsService } from '../../services/trips.service';

@Component({
  imports: [Header, MatIcon, SeatSelector],
  selector: 'app-trips-page',
  styleUrl: './trips-page.scss',
  templateUrl: './trips-page.html',
})
export class TripsPage {
  private readonly seatsDialog = viewChild.required<ElementRef<HTMLDialogElement>>('seatsDialog');
  private readonly params = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });
  private readonly priceFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  private readonly tripsService = inject(TripsService);
  private readonly router = inject(Router);
  private readonly window = inject(DOCUMENT).defaultView;
  protected readonly from = computed(() => this.params().get('from') ?? '');
  protected readonly to = computed(() => this.params().get('to') ?? '');
  protected readonly date = computed(() => this.params().get('date') ?? '');
  protected readonly complete = computed(() => Boolean(this.from() && this.to() && this.date()));
  protected readonly trips = signal<Trip[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadError = signal(false);
  protected readonly selectedTrip = signal<Trip | null>(null);
  protected readonly dateLabel = computed(() => {
    try {
      return Temporal.PlainDate.from(this.date()).toLocaleString('pt-BR', { dateStyle: 'long' });
    } catch {
      return this.date();
    }
  });

  constructor() {
    afterRenderEffect(() => {
      if (this.selectedTrip()) {
        this.seatsDialog().nativeElement.showModal();
      }
    });

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

  protected openSeats(trip: Trip) {
    if (this.window?.matchMedia?.('(max-width: 720px)').matches) {
      void this.router.navigate(['/assentos'], {
        queryParams: {
          travelId: trip.id,
          maximumAllowedPassengers: trip.maximumAllowedPassengers,
          from: trip.from.name,
          to: trip.to.name,
          departureDate: trip.departure.date,
          departureTime: trip.departure.time,
          company: trip.company.name,
          seatClass: trip.seatClass,
          price: trip.price.price,
          searchFrom: this.from(),
          searchTo: this.to(),
          date: this.date(),
        },
      });
      return;
    }

    this.selectedTrip.set(trip);
  }

  protected closeSeats() {
    this.seatsDialog().nativeElement.close();
    this.selectedTrip.set(null);
  }

  protected goToCheckout(seats: string[]) {
    const trip = this.selectedTrip();
    if (!trip || !seats.length) return;

    this.closeSeats();
    void this.router.navigate(['/checkout'], {
      queryParams: {
        travelId: trip.id,
        from: trip.from.name,
        to: trip.to.name,
        departure: `${trip.departure.date}T${trip.departure.time}`,
        company: trip.company.name,
        seatClass: trip.seatClass,
        seats: seats.join(','),
        price: trip.price.price,
      },
    });
  }
}
