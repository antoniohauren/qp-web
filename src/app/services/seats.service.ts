import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';

declare const API_URL: string;

export interface SeatPosition {
  x: number;
  y: number;
  z: number;
}

export interface BusSeat {
  seat: string;
  position: SeatPosition;
  occupied: boolean;
  type: 'seat';
}

export interface EmptySeatSpace {
  seat: null;
  position: SeatPosition;
  type: 'emptyOrReservedSpace';
}

export type SeatCell = BusSeat | EmptySeatSpace;

export interface SeatsLayout {
  orientation: 'horizontal' | 'vertical';
  floor: number;
  seatsLayout: string;
  seats: SeatCell[][];
}

@Service()
export class SeatsService {
  private readonly http = inject(HttpClient);

  getSeats(travelId: string) {
    return this.http.post<SeatsLayout[]>(`${API_URL}/api/seats`, { travelId });
  }
}
