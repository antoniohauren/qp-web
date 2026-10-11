import {
  Component,
  DOCUMENT,
  ElementRef,
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
import { Subscription } from 'rxjs';
import { Header } from '../../sections/header/header';
import { SeatsLayout, SeatsService } from '../../services/seats.service';
import { Trip, TripsService } from '../../services/trips.service';

@Component({
  imports: [Header, MatIcon],
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
  private readonly seatsService = inject(SeatsService);
  private readonly tripsService = inject(TripsService);
  private readonly router = inject(Router);
  private readonly window = inject(DOCUMENT).defaultView;
  private seatsRequest?: Subscription;
  protected readonly from = computed(() => this.params().get('from') ?? '');
  protected readonly to = computed(() => this.params().get('to') ?? '');
  protected readonly date = computed(() => this.params().get('date') ?? '');
  protected readonly complete = computed(() => Boolean(this.from() && this.to() && this.date()));
  protected readonly trips = signal<Trip[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadError = signal(false);
  protected readonly selectedTrip = signal<Trip | null>(null);
  protected readonly layouts = signal<SeatsLayout[]>([]);
  protected readonly seatsLoading = signal(false);
  protected readonly seatsLoadError = signal(false);
  protected readonly selectedSeats = signal<string[]>([]);
  protected readonly selectionFull = computed(() => this.selectedSeats().length === 4);
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

  protected openSeats(trip: Trip) {
    if (this.window?.matchMedia?.('(max-width: 720px)').matches) {
      void this.router.navigate(['/assentos'], {
        queryParams: {
          travelId: trip.id,
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

    this.seatsRequest?.unsubscribe();
    this.selectedTrip.set(trip);
    this.layouts.set([]);
    this.selectedSeats.set([]);
    this.seatsLoadError.set(false);
    this.seatsLoading.set(true);
    this.seatsDialog().nativeElement.showModal();

    this.seatsRequest = this.seatsService.getSeats(trip.id).subscribe({
      next: (layouts) =>
        this.layouts.set(
          layouts.map((layout) => ({
            ...layout,
            seats: layout.seats
              .map((row) => [...row].sort((a, b) => a.position.x - b.position.x))
              .sort((a, b) => (b[0]?.position.y ?? 0) - (a[0]?.position.y ?? 0)),
          })),
        ),
      error: () => {
        this.seatsLoadError.set(true);
        this.seatsLoading.set(false);
      },
      complete: () => this.seatsLoading.set(false),
    });
  }

  protected closeSeats() {
    this.seatsRequest?.unsubscribe();
    this.seatsLoading.set(false);
    this.seatsDialog().nativeElement.close();
  }

  protected toggleSeat(seat: string) {
    this.selectedSeats.update((selected) => {
      if (selected.includes(seat)) return selected.filter((item) => item !== seat);
      return selected.length < 4 ? [...selected, seat] : selected;
    });
  }

  protected goToCheckout() {
    const trip = this.selectedTrip();
    const seats = this.selectedSeats();
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
