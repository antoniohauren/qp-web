import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Temporal } from '@js-temporal/polyfill';
import { Header } from '../../sections/header/header';
import { SeatsLayout, SeatsService } from '../../services/seats.service';

@Component({
  imports: [Header, RouterLink],
  selector: 'app-seats-page',
  styleUrl: './seats-page.scss',
  templateUrl: './seats-page.html',
})
export class SeatsPage {
  private readonly params = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });
  private readonly seatsService = inject(SeatsService);
  private readonly router = inject(Router);
  protected readonly searchParams = computed(() => ({
    from: this.params().get('searchFrom'),
    to: this.params().get('searchTo'),
    date: this.params().get('date'),
  }));
  protected readonly travelId = computed(() => this.params().get('travelId') ?? '');
  protected readonly from = computed(() => this.params().get('from') ?? '');
  protected readonly to = computed(() => this.params().get('to') ?? '');
  protected readonly company = computed(() => this.params().get('company') ?? '');
  protected readonly seatClass = computed(() => this.params().get('seatClass')?.trim() ?? '');
  protected readonly departureLabel = computed(() => {
    const date = this.params().get('departureDate') ?? '';
    const time = this.params().get('departureTime')?.slice(0, 5) ?? '';
    if (!date) return time;

    try {
      const dateLabel = Temporal.PlainDate.from(date).toLocaleString('pt-BR', {
        dateStyle: 'long',
      });
      return time ? `${dateLabel}, às ${time}` : dateLabel;
    } catch {
      return time ? `${date}, às ${time}` : date;
    }
  });
  protected readonly layouts = signal<SeatsLayout[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadError = signal(false);
  protected readonly selectedSeats = signal<string[]>([]);
  protected readonly selectionFull = computed(() => this.selectedSeats().length === 4);

  constructor() {
    effect((onCleanup) => {
      const travelId = this.travelId();
      this.selectedSeats.set([]);
      if (!travelId) return;

      this.loading.set(true);
      this.loadError.set(false);
      this.layouts.set([]);
      const request = this.seatsService.getSeats(travelId).subscribe({
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
          this.loadError.set(true);
          this.loading.set(false);
        },
        complete: () => this.loading.set(false),
      });
      onCleanup(() => request.unsubscribe());
    });
  }

  protected toggleSeat(seat: string) {
    this.selectedSeats.update((selected) => {
      if (selected.includes(seat)) return selected.filter((item) => item !== seat);
      return selected.length < 4 ? [...selected, seat] : selected;
    });
  }

  protected goToCheckout() {
    const seats = this.selectedSeats();
    if (!this.travelId() || !seats.length) return;

    void this.router.navigate(['/checkout'], {
      queryParams: {
        travelId: this.travelId(),
        from: this.from(),
        to: this.to(),
        departure: `${this.params().get('departureDate')}T${this.params().get('departureTime')}`,
        company: this.company(),
        seatClass: this.seatClass(),
        seats: seats.join(','),
        price: this.params().get('price'),
      },
    });
  }
}
