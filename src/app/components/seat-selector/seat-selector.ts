import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { SeatsLayout, SeatsService } from '../../services/seats.service';

@Component({
  selector: 'app-seat-selector',
  styleUrl: './seat-selector.scss',
  templateUrl: './seat-selector.html',
})
export class SeatSelector {
  readonly travelId = input.required<string>();
  readonly headingLevel = input<2 | 3>(2);
  readonly checkout = output<string[]>();
  private readonly seatsService = inject(SeatsService);
  protected readonly layouts = signal<SeatsLayout[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadError = signal(false);
  protected readonly selectedSeats = signal<string[]>([]);
  protected readonly selectionFull = computed(() => this.selectedSeats().length === 4);

  constructor() {
    effect((onCleanup) => {
      const travelId = this.travelId();
      this.selectedSeats.set([]);
      this.layouts.set([]);
      this.loadError.set(false);
      this.loading.set(false);
      if (!travelId) return;

      this.loading.set(true);
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

    this.checkout.emit(seats);
  }
}
