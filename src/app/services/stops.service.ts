import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';

declare const API_URL: string;

interface Station {
  id: string;
  name: string;
  url: string;
  type: 'station';
  sub_type: string | null;
}

export interface Stop {
  id: string;
  name: string;
  url: string;
  type: 'city';
  substops?: Station[];
  available: boolean;
}

@Service()
export class StopsService {
  private readonly http = inject(HttpClient);

  getStops() {
    return this.http.get<Stop[]>(`${API_URL}/api/stops`);
  }
}
