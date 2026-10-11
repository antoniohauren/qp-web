import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SeatSelector } from './seat-selector';

describe('SeatSelector', () => {
  it('keeps selection and checkout within a reduced limit, including zero', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    Object.assign(globalThis, { API_URL: 'http://127.0.0.1:8000' });
    const fixture = TestBed.createComponent(SeatSelector);
    const http = TestBed.inject(HttpTestingController);
    const element: HTMLElement = fixture.nativeElement;
    const checkouts: string[][] = [];
    fixture.componentInstance.checkout.subscribe((seats) => checkouts.push(seats));
    fixture.componentRef.setInput('travelId', 'trip-1');
    fixture.detectChanges();
    http.expectOne('http://127.0.0.1:8000/api/seats').flush([
      {
        orientation: 'horizontal',
        floor: 0,
        seatsLayout: 'numbered',
        seats: [[1, 2, 3, 4, 5].map((number) => ({
          seat: String(number),
          position: { x: number, y: 0, z: 0 },
          occupied: false,
          type: 'seat',
        }))],
      },
    ]);
    fixture.detectChanges();
    const seats = element.querySelectorAll<HTMLButtonElement>('.seat');
    seats.forEach((seat) => seat.click());
    fixture.detectChanges();
    expect(element.textContent).toContain('4 de 4 assentos');

    fixture.componentRef.setInput('maximumAllowedPassengers', 2);
    fixture.detectChanges();
    expect(element.querySelectorAll('.seat.selected')).toHaveLength(2);
    expect(element.textContent).toContain('2 de 2 assentos');
    expect(seats[2].disabled).toBe(true);
    element.querySelector<HTMLButtonElement>('.checkout-button')!.click();
    expect(checkouts).toEqual([['1', '2']]);

    fixture.componentRef.setInput('maximumAllowedPassengers', 0);
    fixture.detectChanges();
    expect(element.textContent).toContain('0 de 0 assentos');
    expect(element.textContent).toContain('Selecione até 0 lugares');
    expect(Array.from(seats).every((seat) => seat.disabled)).toBe(true);
    expect(element.querySelector<HTMLButtonElement>('.checkout-button')!.disabled).toBe(true);
    http.verify();
  });

  it('cancels stale requests and clears selection when the trip changes', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    Object.assign(globalThis, { API_URL: 'http://127.0.0.1:8000' });
    const fixture = TestBed.createComponent(SeatSelector);
    const http = TestBed.inject(HttpTestingController);
    const element: HTMLElement = fixture.nativeElement;
    fixture.componentRef.setInput('travelId', 'trip-1');
    fixture.detectChanges();
    const stale = http.expectOne('http://127.0.0.1:8000/api/seats');

    fixture.componentRef.setInput('travelId', 'trip-2');
    fixture.detectChanges();
    expect(stale.cancelled).toBe(true);
    const request = http.expectOne('http://127.0.0.1:8000/api/seats');
    expect(request.request.body).toEqual({ travelId: 'trip-2' });
    request.flush([
      {
        orientation: 'horizontal',
        floor: 0,
        seatsLayout: 'numbered',
        seats: [[{ seat: '01', position: { x: 1, y: 0, z: 0 }, occupied: false, type: 'seat' }]],
      },
    ]);
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('.seat')!.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.seat.selected')).toHaveLength(1);

    fixture.componentRef.setInput('travelId', 'trip-3');
    fixture.detectChanges();
    expect(element.querySelectorAll('.seat')).toHaveLength(0);
    http.expectOne('http://127.0.0.1:8000/api/seats').flush(null, {
      status: 500,
      statusText: 'Server error',
    });
    fixture.detectChanges();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Não foi possível carregar os assentos',
    );

    fixture.componentRef.setInput('travelId', 'trip-4');
    fixture.detectChanges();
    http.expectOne('http://127.0.0.1:8000/api/seats').flush([]);
    fixture.detectChanges();
    expect(element.textContent).toContain('Nenhum assento encontrado');

    fixture.componentRef.setInput('travelId', '');
    fixture.detectChanges();
    expect(element.textContent).toContain('Viagem não informada');
    http.verify();
  });
});
