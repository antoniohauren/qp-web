import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Temporal } from '@js-temporal/polyfill';
import { SeatSelector } from '../../components/seat-selector/seat-selector';
import { Header } from '../../sections/header/header';

@Component({
  imports: [Header, RouterLink, SeatSelector],
  selector: 'app-seats-page',
  styleUrl: './seats-page.scss',
  templateUrl: './seats-page.html',
})
export class SeatsPage {
  private readonly params = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });
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

  protected goToCheckout(seats: string[]) {
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
