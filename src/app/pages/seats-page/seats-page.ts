import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Temporal } from '@js-temporal/polyfill';
import { Header } from '../../sections/header/header';
import { SeatsLayout, SeatsService } from '../../services/seats.service';

@Component({
  imports: [Header],
  selector: 'app-seats-page',
  styleUrl: './seats-page.scss',
  templateUrl: './seats-page.html',
})
export class SeatsPage {
  private readonly params = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });
  private readonly seatsService = inject(SeatsService);
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

  constructor() {
    effect((onCleanup) => {
      const travelId = this.travelId();
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
}
