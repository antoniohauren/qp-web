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
    TestBed.inject(HttpTestingController)
      .expectOne('http://127.0.0.1:8000/api/search/ROD_948/CIT_940/2026-10-11')
      .flush([
        {
          id: 'trip-1',
          from: { name: 'São Paulo, SP - Rodoviária do Tietê' },
          to: { name: 'Curitiba, PR - Rodoviária' },
          departure: { date: '2026-10-11', time: '08:30:00' },
          arrival: { date: '2026-10-11', time: '14:45:00' },
          travelDuration: 22500,
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
  });
});
