import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, vi } from 'vitest';
import { CheckoutPage } from '../checkout-page/checkout-page';
import { SeatsPage } from '../seats-page/seats-page';
import { TripsPage } from './trips-page';

describe('TripsPage', () => {
  afterEach(() => vi.unstubAllGlobals());

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

  it('uses the seat page on mobile and carries the selection and fare to checkout', async () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true });
    vi.stubGlobal('matchMedia', matchMedia);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'passagens', component: TripsPage },
          { path: 'assentos', component: SeatsPage },
          { path: 'checkout', component: CheckoutPage },
        ]),
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
        from: { name: 'São Paulo, SP' },
        to: { name: 'Curitiba, PR' },
        departure: { date: '2026-10-11', time: '08:30:00' },
        arrival: { date: '2026-10-11', time: '14:45:00' },
        travelDuration: 22500,
        seatClass: 'EXECUTIVO',
        price: { price: 79.9 },
      },
    ]);
    harness.detectChanges();
    const dialog = harness.routeNativeElement!.querySelector<HTMLDialogElement>('dialog')!;
    const showModal = vi.fn();
    Object.assign(dialog, { showModal });
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.choose-button')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(matchMedia).toHaveBeenCalledWith('(max-width: 720px)');
    expect(showModal).not.toHaveBeenCalled();
    expect(TestBed.inject(Router).url).toContain('/assentos?');
    const page = harness.routeNativeElement!;
    expect(page.querySelector('.back-link')?.getAttribute('href')).toBe(
      '/passagens?from=ROD_948&to=CIT_940&date=2026-10-11',
    );
    expect(page.textContent).toContain('Carregando mapa de assentos');
    const request = http.expectOne('http://127.0.0.1:8000/api/seats');
    expect(request.request.body).toEqual({ travelId: 'trip-1' });
    request.flush(
      [0, 1].map((floor) => ({
        orientation: 'horizontal',
        floor,
        seatsLayout: 'numbered',
        seats: [
          [1, 2, 3].map((number) => ({
            seat: String(floor * 3 + number).padStart(2, '0'),
            position: { x: number, y: 0, z: floor },
            occupied: floor === 1 && number === 3,
            type: 'seat',
          })),
        ],
      })),
    );
    harness.detectChanges();
    const seats = page.querySelectorAll<HTMLButtonElement>('.seat');
    const checkout = page.querySelector<HTMLButtonElement>('.checkout-button')!;
    expect(checkout.disabled).toBe(true);
    expect(seats[5].disabled).toBe(true);
    seats[5].click();
    Array.from(seats)
      .slice(0, 4)
      .forEach((seat) => seat.click());
    harness.detectChanges();
    expect(page.querySelectorAll('.seat.selected')).toHaveLength(4);
    expect(seats[4].disabled).toBe(true);
    expect(seats[0].getAttribute('aria-pressed')).toBe('true');
    expect(page.querySelector('.selection-footer')?.textContent).toContain('4 de 4 assentos');

    seats[0].click();
    harness.detectChanges();
    expect(seats[4].disabled).toBe(false);
    expect(seats[0].getAttribute('aria-pressed')).toBe('false');
    seats[4].click();
    harness.detectChanges();
    checkout.click();
    await harness.fixture.whenStable();
    harness.detectChanges();

    const params = TestBed.inject(Router).parseUrl(TestBed.inject(Router).url).queryParams;
    expect(params).toEqual({
      travelId: 'trip-1',
      from: 'São Paulo, SP',
      to: 'Curitiba, PR',
      departure: '2026-10-11T08:30:00',
      company: '1001',
      seatClass: 'EXECUTIVO',
      seats: '02,03,04,05',
      price: '79.9',
    });
    expect(harness.routeNativeElement!.querySelector('.total')?.textContent).toContain('319,60');
    http.verify();
  });
});
