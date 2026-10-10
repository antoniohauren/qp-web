import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Header } from '../../sections/header/header';

declare const API_URL: string;

interface Station {
  id: string;
  name: string;
  url: string;
  type: 'station';
  sub_type: string | null;
}

interface Stop {
  id: string;
  name: string;
  url: string;
  type: 'city';
  substops?: Station[];
  available: boolean;
}

@Component({
  imports: [Header],
  selector: 'app-home-page',
  styleUrl: './home-page.scss',
  templateUrl: './home-page.html',
})
export class HomePage {
  private readonly http = inject(HttpClient);
  protected readonly cities = signal<Stop[]>([]);
  protected readonly loadError = signal(false);
  protected readonly loading = signal(true);

  constructor() {
    this.http.get<Stop[]>(`${API_URL}/api/stops`).subscribe({
      next: (cities) => this.cities.set(cities),
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
