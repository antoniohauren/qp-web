import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Temporal } from '@js-temporal/polyfill';
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
      name: 'Rodoviária de Batayporã, MS',
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

  it('hides the selected origin from destination options', () => {
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    Object.assign(dialog, {
      close: () => dialog.removeAttribute('open'),
      showModal: () => dialog.setAttribute('open', ''),
    });
    const selectors = fixture.nativeElement.querySelectorAll('.stop-selector');

    (selectors[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.stop-list button') as HTMLButtonElement).click();
    fixture.detectChanges();
    (selectors[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('.stop-list button');
    expect(options).toHaveLength(1);
  });

  it('swaps the origin and destination', () => {
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    Object.assign(dialog, {
      close: () => dialog.removeAttribute('open'),
      showModal: () => dialog.setAttribute('open', ''),
    });
    const selectors = fixture.nativeElement.querySelectorAll('.stop-selector');

    (selectors[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelectorAll('.stop-list button')[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    (selectors[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.stop-list button') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.swap-stops') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(selectors[0].textContent).toContain('Rodoviária de Batayporã, MS');
    expect(selectors[1].textContent).toContain('Batayporã, MS');
  });

  it('highlights the selection for the current field', () => {
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    Object.assign(dialog, {
      close: () => dialog.removeAttribute('open'),
      showModal: () => dialog.setAttribute('open', ''),
    });
    const origin = fixture.nativeElement.querySelector('.stop-selector') as HTMLButtonElement;

    origin.click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.stop-list button') as HTMLButtonElement).click();
    fixture.detectChanges();
    origin.click();
    fixture.detectChanges();

    const selected = fixture.nativeElement.querySelector('.stop-list button.selected');
    expect(selected).not.toBeNull();
    expect((selected as HTMLButtonElement).disabled).toBe(false);
  });

  it('marks unavailable cities', () => {
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    Object.assign(dialog, { showModal: () => dialog.setAttribute('open', '') });

    (fixture.nativeElement.querySelector('.stop-selector') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.stop-list button').classList).toContain(
      'unavailable',
    );
  });

  it('selects a travel date from the date dialog', () => {
    const dialogs = fixture.nativeElement.querySelectorAll('dialog');
    const dialog = dialogs[1] as HTMLDialogElement;
    Object.assign(dialog, {
      close: () => dialog.removeAttribute('open'),
      showModal: () => dialog.setAttribute('open', ''),
    });

    const selectors = fixture.nativeElement.querySelectorAll('.stop-selector');
    (selectors[2] as HTMLButtonElement).click();
    fixture.detectChanges();

    const day = fixture.nativeElement.querySelector(
      '.calendar-day:not(:disabled):not(.outside-month)',
    ) as HTMLButtonElement;
    const selectedDate = day.dataset['date']!;
    day.click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.confirm-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    const expectedLabel = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(
      new Date(`${selectedDate}T00:00:00`),
    );
    expect(selectors[2].textContent).toContain(expectedLabel);
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('selects tomorrow from the date shortcut', () => {
    const tomorrow = Temporal.Now.plainDateISO().add({ days: 1 });

    (fixture.nativeElement.querySelector('.tomorrow-date') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.stop-selector')[2].textContent).toContain(
      tomorrow.toLocaleString('pt-BR', { dateStyle: 'long' }),
    );
  });
});
