import { Component, inject, signal } from '@angular/core';
import { Header } from '../../sections/header/header';
import { Stop, StopsService } from '../../services/stops.service';

@Component({
  imports: [Header],
  selector: 'app-home-page',
  styleUrl: './home-page.scss',
  templateUrl: './home-page.html',
})
export class HomePage {
  private readonly stopsService = inject(StopsService);
  protected readonly cities = signal<Stop[]>([]);
  protected readonly loadError = signal(false);
  protected readonly loading = signal(true);

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
}
