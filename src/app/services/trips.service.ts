import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';

declare const API_URL: string;

export interface Trip {
  id: string;
  company: { id: string; name: string };
  from: { id: string; name: string; customName: string | null; customAddress: string | null };
  to: { id: string; name: string; customName: string | null; customAddress: string | null };
  availableSeats: number;
  seatsLayout: string;
  withBPE: boolean;
  departure: { date: string; time: string };
  arrival: { date: string; time: string };
  travelDuration: number;
  travelDistance: string;
  seatClass: string;
  price: { seatPrice: number; taxPrice: number; price: number };
  insurance: number;
  allowCanceling: boolean;
  travelCancellationLimitDate: string;
  travelCancellationFee: number;
  manualConfirmation: boolean;
  CPFRequired: boolean;
  loungeVipAvailable: boolean;
  amenities: unknown[];
  maximumAllowedPassengers: number | null;
}

@Service()
export class TripsService {
  private readonly http = inject(HttpClient);

  getTrips(from: string, to: string, date: string) {
    return this.http.get<Trip[]>(
      `${API_URL}/api/search/${encodeURIComponent(from)}/${encodeURIComponent(to)}/${encodeURIComponent(date)}`,
    );
  }
}
