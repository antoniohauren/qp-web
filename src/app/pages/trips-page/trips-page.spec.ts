import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TripsPage } from './trips-page';

describe('TripsPage', () => {
  it('renders trips returned for the route', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'passagens', component: TripsPage }]),
      ],
    });
    Object.assign(globalThis, { API_URL: 'http://127.0.0.1:8000' });
    const harness = await RouterTestingHarness.create(
      '/passagens?from=ROD_948&to=CIT_940&date=2026-10-11',
    );
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('http://127.0.0.1:8000/api/search/ROD_948/CIT_940/2026-10-11').flush([
      {
        id: 'trip-1',
        company: { id: '2', name: '1001' },
        from: { name: 'São Paulo, SP - Rodoviária do Tietê' },
        to: { name: 'Curitiba, PR - Rodoviária' },
        departure: { date: '2026-10-11', time: '08:30:00' },
        arrival: { date: '2026-10-11', time: '14:45:00' },
        travelDuration: 22500,
        seatClass: 'EXECUTIVO',
        price: { price: 79.9 },
      },
    ]);
    harness.fixture.detectChanges();

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      '11 de outubro de 2026',
    );
    expect(harness.routeNativeElement?.textContent).toContain('08:30');
    expect(harness.routeNativeElement?.textContent).toContain('14:45');
    expect(harness.routeNativeElement?.textContent).toContain(
      'São Paulo, SP - Rodoviária do Tietê',
    );
    expect(harness.routeNativeElement?.textContent).toContain('Curitiba, PR - Rodoviária');
    expect(harness.routeNativeElement?.textContent).toContain('6h 15min');
    expect(harness.routeNativeElement?.textContent).toContain('R$ 79,90');
    expect(harness.routeNativeElement?.querySelector('.choose-button')?.textContent).toContain(
      'Escolher',
    );

    const dialog = harness.routeNativeElement?.querySelector<HTMLDialogElement>('.seats-dialog');
    if (!dialog) throw new Error('Seats dialog not found');
    Object.assign(dialog, {
      showModal: () => dialog.setAttribute('open', ''),
      close: () => dialog.removeAttribute('open'),
    });
    harness.routeNativeElement?.querySelector<HTMLButtonElement>('.choose-button')?.click();
    const seatsRequest = http.expectOne('http://127.0.0.1:8000/api/seats');
    expect(seatsRequest.request.method).toBe('POST');
    expect(seatsRequest.request.body).toEqual({ travelId: 'trip-1' });
    harness.fixture.detectChanges();
    expect(dialog.querySelector('.legend')?.textContent).toContain('Disponível');
    expect(dialog.querySelector('.legend')?.textContent).toContain('Ocupado');
    expect(dialog.querySelectorAll('.skeleton-seat').length).toBe(32);
    seatsRequest.flush([
      {
        orientation: 'horizontal',
        floor: 0,
        seatsLayout: 'numbered',
        seats: [
          [
            {
              seat: '01',
              position: { x: 1, y: 0, z: 0 },
              occupied: false,
              type: 'seat',
            },
            {
              seat: '02',
              position: { x: 2, y: 0, z: 0 },
              occupied: false,
              type: 'seat',
            },
            {
              seat: '03',
              position: { x: 3, y: 0, z: 0 },
              occupied: false,
              type: 'seat',
            },
            {
              seat: '04',
              position: { x: 4, y: 0, z: 0 },
              occupied: false,
              type: 'seat',
            },
            {
              seat: '05',
              position: { x: 5, y: 0, z: 0 },
              occupied: false,
              type: 'seat',
            },
          ],
        ],
      },
    ]);
    harness.fixture.detectChanges();

    expect(dialog.open).toBe(true);
    expect(dialog.textContent).toContain('São Paulo, SP - Rodoviária do Tietê');
    expect(dialog.textContent).toContain('Curitiba, PR - Rodoviária');
    expect(dialog.textContent).toContain('1001');
    const seats = dialog.querySelectorAll<HTMLButtonElement>('.seat');
    expect(Array.from(seats, (seat) => seat.textContent?.trim())).toEqual([
      '01',
      '02',
      '03',
      '04',
      '05',
    ]);

    Array.from(seats)
      .slice(0, 4)
      .forEach((seat) => seat.click());
    harness.fixture.detectChanges();

    expect(dialog.querySelectorAll('.seat.selected').length).toBe(4);
    expect(seats[4].disabled).toBe(true);
    expect(dialog.querySelector('.selection-footer')?.textContent).toContain('4 de 4 assentos');
  });
});
