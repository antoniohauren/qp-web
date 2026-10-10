import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePage } from './home-page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    const station = {
      id: 'ROD_948',
      name: 'Batayporã, MS',
      url: 'bataipora-ms',
      type: 'station' as const,
      sub_type: null,
    };
    Object.assign(globalThis, { API_URL: 'http://127.0.0.1:8000' });
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    TestBed.inject(HttpTestingController)
      .expectOne('http://127.0.0.1:8000/api/stops')
      .flush([
        {
          id: 'CIT_939',
          name: 'Batayporã, MS',
          url: 'bataypora-ms',
          type: 'city',
          substops: [station],
          available: false,
        },
      ]);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('shows stations near their city', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Batayporã, MS');
    expect(fixture.nativeElement.textContent).toContain('Estações');
  });
});
