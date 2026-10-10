import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TripsPage } from './trips-page';

describe('TripsPage', () => {
  it('renders from, to, and date from the route', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'passagens', component: TripsPage }])],
    });
    const harness = await RouterTestingHarness.create(
      '/passagens?from=Batayporã,%20MS&to=Nova%20Andradina,%20MS&date=2026-10-11',
    );

    expect(harness.routeNativeElement?.textContent).toContain('Batayporã, MS');
    expect(harness.routeNativeElement?.textContent).toContain('Nova Andradina, MS');
    expect(harness.routeNativeElement?.textContent).toContain('11 de outubro de 2026');
  });
});
