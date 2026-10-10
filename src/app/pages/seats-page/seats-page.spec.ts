import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SeatsPage } from './seats-page';

describe('SeatsPage', () => {
  it('posts the travel id and renders the seat matrix', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'assentos', component: SeatsPage }]),
      ],
    });
    Object.assign(globalThis, { API_URL: 'http://127.0.0.1:8000' });
    const harness = await RouterTestingHarness.create(
      '/assentos?travelId=trip-1&from=Adamantina%2C%20SP&to=Maring%C3%A1%2C%20PR&company=1001&seatClass=SEMI%20LEITO&departureDate=2026-11-11&departureTime=00%3A30%3A00',
    );
    const request = TestBed.inject(HttpTestingController).expectOne(
      'http://127.0.0.1:8000/api/seats',
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ travelId: 'trip-1' });
    request.flush([
      {
        orientation: 'horizontal',
        floor: 0,
        seatsLayout: 'numbered',
        seats: [
          [
            {
              seat: '02',
              position: { x: 2, y: 0, z: 0 },
              occupied: true,
              type: 'seat',
            },
            {
              seat: '01',
              position: { x: 1, y: 0, z: 0 },
              occupied: false,
              type: 'seat',
            },
          ],
          [
            {
              seat: '04',
              position: { x: 2, y: 1, z: 0 },
              occupied: true,
              type: 'seat',
            },
            {
              seat: '03',
              position: { x: 1, y: 1, z: 0 },
              occupied: false,
              type: 'seat',
            },
            {
              seat: '',
              position: { x: 3, y: 1, z: 0 },
              occupied: true,
              type: 'seat',
            },
          ],
        ],
      },
    ]);
    harness.fixture.detectChanges();

    const seats = harness.routeNativeElement?.querySelectorAll('.seat');
    expect(Array.from(seats ?? [], (seat) => seat.textContent?.trim())).toEqual([
      '03',
      '04',
      '01',
      '02',
    ]);
    expect(seats?.[0].getAttribute('aria-label')).toBe('Assento 03, disponível');
    expect(seats?.[1].classList.contains('occupied')).toBe(true);
    expect(harness.routeNativeElement?.querySelectorAll('.empty-cell').length).toBe(1);
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Adamantina, SP para Maringá, PR',
    );
    expect(harness.routeNativeElement?.querySelector('.trip-meta')?.textContent).toContain(
      '11 de novembro de 2026, às 00:30',
    );
    expect(harness.routeNativeElement?.querySelector('.trip-meta')?.textContent).toContain('1001');
    expect(
      harness.routeNativeElement
        ?.querySelector('.deck-heading')
        ?.firstElementChild?.classList.contains('front-label'),
    ).toBe(true);
  });
});
