import { Component, computed, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
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
  protected readonly cities = signal<Stop[]>([]);
  protected readonly loadError = signal(false);
  protected readonly loading = signal(true);
  protected readonly selectedDate = signal('');
  protected readonly selectedDateLabel = computed(() => {
    const date = this.selectedDate();
    return date
      ? Temporal.PlainDate.from(date).toLocaleString('pt-BR', { dateStyle: 'long' })
      : 'Selecione a data de embarque';
  });
  protected readonly selectedDestination = signal<StopOption | null>(null);
  protected readonly selectedStop = signal<StopOption | null>(null);
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
  }

  protected selectTomorrow() {
    this.selectedDate.set(Temporal.Now.plainDateISO().add({ days: 1 }).toString());
  }

  protected search() {
    const date = this.selectedDate();
    if (date && Temporal.PlainDate.compare(date, Temporal.Now.plainDateISO()) < 0) {
      this.selectedDate.set('');
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
  }
}
