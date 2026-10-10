import { Component, computed, inject, signal } from '@angular/core';
import { Header } from '../../sections/header/header';
import { Stop, StopsService } from '../../services/stops.service';

interface StopOption {
  id: string;
  name: string;
  type: 'city' | 'station';
}

type SelectionField = 'origin' | 'destination';

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');

@Component({
  imports: [Header],
  selector: 'app-home-page',
  styleUrl: './home-page.scss',
  templateUrl: './home-page.html',
})
export class HomePage {
  private readonly stopsService = inject(StopsService);
  protected readonly cities = signal<Stop[]>([]);
  protected readonly filteredStops = computed(() => {
    const query = normalize(this.searchQuery().trim());
    return this.cities()
      .flatMap<StopOption>((city) => [
        { id: city.id, name: city.name, type: 'city' },
        ...(city.substops ?? []).map((station) => ({
          id: station.id,
          name: station.name,
          type: station.type,
        })),
      ])
      .filter((stop) => !query || normalize(stop.name).includes(query));
  });
  protected readonly loadError = signal(false);
  protected readonly loading = signal(true);
  protected readonly selectionField = signal<SelectionField>('origin');
  protected readonly searchQuery = signal('');
  protected readonly selectedDestination = signal<StopOption | null>(null);
  protected readonly selectedStop = signal<StopOption | null>(null);

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

  protected openSelector(dialog: HTMLDialogElement, field: SelectionField) {
    this.selectionField.set(field);
    this.searchQuery.set('');
    dialog.showModal();
  }

  protected selectStop(stop: StopOption, dialog: HTMLDialogElement) {
    if (this.selectionField() === 'origin') {
      this.selectedStop.set(stop);
    } else {
      this.selectedDestination.set(stop);
    }
    dialog.close();
  }
}
