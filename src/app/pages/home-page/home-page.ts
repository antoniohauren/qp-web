import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { Temporal } from '@js-temporal/polyfill';
import { DatePickerDialog } from '../../components/date-picker-dialog/date-picker-dialog';
import {
  StopOption,
  StopSelection,
  StopSelectorDialog,
} from '../../components/stop-selector-dialog/stop-selector-dialog';
import { Header } from '../../sections/header/header';
import { Stop, StopsService } from '../../services/stops.service';

@Component({
  imports: [DatePickerDialog, Header, MatIcon, StopSelectorDialog],
  selector: 'app-home-page',
  styleUrl: './home-page.scss',
  templateUrl: './home-page.html',
})
export class HomePage {
  private readonly stopsService = inject(StopsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.queryParamMap, { requireSync: true });
  protected readonly cities = signal<Stop[]>([]);
  protected readonly loadError = signal(false);
  protected readonly loading = signal(true);
  protected readonly selectedDate = linkedSignal(() => {
    const date = this.params().get('date') ?? '';
    try {
      return /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        Temporal.PlainDate.compare(date, Temporal.Now.plainDateISO()) >= 0
        ? date
        : '';
    } catch {
      return '';
    }
  });
  protected readonly selectedDateLabel = computed(() => {
    const date = this.selectedDate();
    return date
      ? Temporal.PlainDate.from(date).toLocaleString('pt-BR', { dateStyle: 'long' })
      : 'Selecione a data de embarque';
  });
  protected readonly selectedDestination = linkedSignal(() =>
    this.params().get('to') === this.params().get('from')
      ? null
      : this.resolveStop(this.params().get('to')),
  );
  protected readonly selectedStop = linkedSignal(() => this.resolveStop(this.params().get('from')));
  protected readonly unavailableSelection = computed(
    () =>
      !this.loading() &&
      (this.selectedStop()?.available === false || this.selectedDestination()?.available === false),
  );
  protected readonly searchDisabled = computed(
    () =>
      !this.selectedStop()?.available ||
      !this.selectedDestination()?.available ||
      !this.selectedDate(),
  );
  protected readonly swapAnimation = signal<'swap-a' | 'swap-b' | null>(null);

  constructor() {
    this.stopsService.getStops().subscribe({
      next: (cities) => this.cities.set(cities),
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  protected selectStop({ field, stop }: StopSelection) {
    if (field === 'origin') {
      this.selectedStop.set(stop);
    } else {
      this.selectedDestination.set(stop);
    }
    this.syncParams();
  }

  protected selectDate(date: string) {
    this.selectedDate.set(date);
    this.syncParams();
  }

  private resolveStop(id: string | null): StopOption | null {
    for (const city of this.cities()) {
      if (city.id === id) return city;
      const station = city.substops?.find((stop) => stop.id === id);
      if (station) return { ...station, available: true };
    }
    return null;
  }

  private syncParams() {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        from: this.selectedStop()?.id ?? null,
        to: this.selectedDestination()?.id ?? null,
        date: this.selectedDate() || null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected search() {
    const date = this.selectedDate();
    if (date && Temporal.PlainDate.compare(date, Temporal.Now.plainDateISO()) < 0) {
      this.selectDate('');
      return;
    }
    if (this.loading() || this.searchDisabled()) return;

    void this.router.navigate(['/passagens'], {
      queryParams: {
        from: this.selectedStop()?.id,
        to: this.selectedDestination()?.id,
        date,
      },
    });
  }

  protected swapStops() {
    const origin = this.selectedStop();
    this.selectedStop.set(this.selectedDestination());
    this.selectedDestination.set(origin);
    this.swapAnimation.update((animation) => (animation === 'swap-a' ? 'swap-b' : 'swap-a'));
    this.syncParams();
  }
}
