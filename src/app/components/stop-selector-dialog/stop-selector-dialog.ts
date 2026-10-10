import { Component, ElementRef, computed, input, output, signal, viewChild } from '@angular/core';
import { Stop } from '../../services/stops.service';

export interface StopOption {
  available: boolean;
  id: string;
  name: string;
  type: 'city' | 'station';
}

export type SelectionField = 'origin' | 'destination';

export interface StopSelection {
  field: SelectionField;
  stop: StopOption;
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');

@Component({
  selector: 'app-stop-selector-dialog',
  styleUrl: './stop-selector-dialog.scss',
  templateUrl: './stop-selector-dialog.html',
})
export class StopSelectorDialog {
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  readonly cities = input.required<Stop[]>();
  readonly destination = input<StopOption | null>(null);
  readonly origin = input<StopOption | null>(null);
  readonly selected = output<StopSelection>();
  protected readonly field = signal<SelectionField>('origin');
  protected readonly searchQuery = signal('');
  protected readonly filteredStops = computed(() => {
    const query = normalize(this.searchQuery().trim());
    const oppositeStop = this.field() === 'origin' ? this.destination() : this.origin();
    return this.cities()
      .flatMap<StopOption>((city) => [
        { available: city.available, id: city.id, name: city.name, type: 'city' },
        ...(city.substops ?? []).map((station) => ({
          available: true,
          id: station.id,
          name: station.name,
          type: station.type,
        })),
      ])
      .filter(
        (stop) => stop.id !== oppositeStop?.id && (!query || normalize(stop.name).includes(query)),
      );
  });

  open(field: SelectionField) {
    this.field.set(field);
    this.searchQuery.set('');
    this.dialog().nativeElement.showModal();
  }

  protected select(stop: StopOption) {
    this.selected.emit({ field: this.field(), stop });
    this.dialog().nativeElement.close();
  }

  protected isSelected(stop: StopOption) {
    const selectedStop = this.field() === 'origin' ? this.origin() : this.destination();
    return stop.id === selectedStop?.id;
  }
}
