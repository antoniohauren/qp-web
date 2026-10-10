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

  it('selects a destination from the searchable dialog', () => {
    expect(component).toBeTruthy();
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    Object.assign(dialog, {
      close: () => dialog.removeAttribute('open'),
      showModal: () => dialog.setAttribute('open', ''),
    });

    const selectors = fixture.nativeElement.querySelectorAll('.stop-selector');
    (selectors[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    const search = fixture.nativeElement.querySelector('#stop-search') as HTMLInputElement;
    search.value = 'bataypora';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.stop-list button')).toHaveLength(2);
    (fixture.nativeElement.querySelectorAll('.stop-list button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(selectors[0].textContent).toContain('Selecione seu local de embarque');
    expect(selectors[1].textContent).toContain('Batayporã, MS');
  });
});
