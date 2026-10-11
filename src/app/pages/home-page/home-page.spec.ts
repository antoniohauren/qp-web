import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Subject } from 'rxjs';
import { afterEach, vi } from 'vitest';
import { Stop, StopsService } from '../../services/stops.service';
import { HomePage } from './home-page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 0, 31, 23, 59));
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

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
        {
          id: 'CIT_940',
          name: 'Nova Andradina, MS',
          url: 'nova-andradina-ms',
          type: 'city',
          available: true,
        },
      ]);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('across midnight on the same page', () => {
    function click(selector: string) {
      (fixture.nativeElement.querySelector(selector) as HTMLButtonElement).click();
      fixture.detectChanges();
    }

    function nextDay() {
      vi.setSystemTime(new Date(2026, 1, 1, 0, 1));
    }

    beforeEach(() => {
      for (const dialog of fixture.nativeElement.querySelectorAll('dialog')) {
        Object.assign(dialog, {
          close: () => dialog.removeAttribute('open'),
          showModal: () => dialog.setAttribute('open', ''),
        });
      }
      click('.stop-selector:nth-child(1)');
      click('.stop-list li:nth-child(2) button');
      click('.stop-selector:nth-child(2)');
      click('.stop-list li:nth-child(2) button');
    });

    it('refreshes the minimum and clears an expired selection when reopened', () => {
      click('.stop-selector:nth-child(3)');
      click('[data-date="2026-01-31"]');
      click('.confirm-button');
      nextDay();
      click('.stop-selector:nth-child(3)');

      expect(fixture.nativeElement.querySelector('[data-date="2026-02-01"]').disabled).toBe(false);
      expect(fixture.nativeElement.querySelector('[aria-label="Mês anterior"]').disabled).toBe(true);
      expect(fixture.nativeElement.querySelector('.calendar-day.selected')).toBeNull();
      expect(fixture.nativeElement.querySelector('.confirm-button').disabled).toBe(true);
      expect(fixture.nativeElement.querySelector('.search-button').disabled).toBe(true);
      expect(fixture.nativeElement.querySelectorAll('.stop-selector')[2].textContent).toContain(
        'Selecione a data de embarque',
      );
    });

    it('rejects a pending date that expires while the picker stays open', () => {
      click('.stop-selector:nth-child(3)');
      click('[data-date="2026-01-31"]');
      click('.confirm-button');
      click('.stop-selector:nth-child(3)');
      nextDay();
      click('.confirm-button');

      expect(fixture.nativeElement.querySelectorAll('dialog')[1].open).toBe(true);
      expect(fixture.nativeElement.querySelector('[data-date="2026-01-31"]').disabled).toBe(true);
      expect(fixture.nativeElement.querySelector('.confirm-button').disabled).toBe(true);
      expect(fixture.nativeElement.querySelector('.search-button').disabled).toBe(true);
    });

    it('rejects clicking yesterday in a calendar left open overnight', () => {
      click('.stop-selector:nth-child(3)');
      nextDay();
      click('[data-date="2026-01-31"]');

      expect(fixture.nativeElement.querySelector('[data-date="2026-01-31"]').disabled).toBe(true);
      expect(fixture.nativeElement.querySelector('.confirm-button').disabled).toBe(true);
      click('[data-date="2026-02-01"]');
      click('.confirm-button');
      expect(fixture.nativeElement.querySelectorAll('dialog')[1].open).toBe(false);
    });

    it('blocks expired search, then navigates with a newly selected date and the same params', () => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      click('.stop-selector:nth-child(3)');
      click('[data-date="2026-01-31"]');
      click('.confirm-button');
      nextDay();
      click('.search-button');

      expect(navigate).not.toHaveBeenCalledWith(['/passagens'], expect.anything());
      expect(navigate).toHaveBeenLastCalledWith(
        [],
        expect.objectContaining({
          queryParams: { from: 'ROD_948', to: 'CIT_940', date: null },
          replaceUrl: true,
        }),
      );
      expect(navigateByUrl).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('.search-button').disabled).toBe(true);
      expect(fixture.nativeElement.querySelectorAll('.stop-selector')[2].textContent).toContain(
        'Selecione a data de embarque',
      );
      click('.stop-selector:nth-child(3)');
      click('[data-date="2026-02-02"]');
      click('.confirm-button');
      click('.search-button');
      expect(navigate).toHaveBeenCalledWith(['/passagens'], {
        queryParams: { from: 'ROD_948', to: 'CIT_940', date: '2026-02-02' },
      });
    });
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

    expect(selectors[0].textContent).toContain('Selecione local');
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
    (fixture.nativeElement.querySelector('.stop-list button[aria-disabled="false"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (selectors[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('.stop-list button');
    expect(options).toHaveLength(2);
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
    (fixture.nativeElement.querySelectorAll('.stop-list button')[2] as HTMLButtonElement).click();
    fixture.detectChanges();
    (selectors[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.stop-list button[aria-disabled="false"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.swap-stops') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(selectors[0].textContent).toContain('Rodoviária de Batayporã, MS');
    expect(selectors[1].textContent).toContain('Nova Andradina, MS');
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
    (fixture.nativeElement.querySelector('.stop-list button[aria-disabled="false"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    origin.click();
    fixture.detectChanges();

    const selected = fixture.nativeElement.querySelector('.stop-list button.selected');
    expect(selected).not.toBeNull();
    expect((selected as HTMLButtonElement).disabled).toBe(false);
    expect(selected.getAttribute('aria-pressed')).toBe('true');
    expect(selected.textContent).toContain('Selecionado');
    expect(fixture.nativeElement.querySelectorAll('.stop-list [aria-pressed="true"]')).toHaveLength(1);
    expect(
      fixture.nativeElement.querySelector('.stop-list button:not(.selected)').getAttribute('aria-pressed'),
    ).toBe('false');
  });

  it('marks unavailable cities and ignores selection for either field', () => {
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    Object.assign(dialog, { showModal: () => dialog.setAttribute('open', '') });

    (fixture.nativeElement.querySelector('.stop-selector') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.stop-list button').classList).toContain(
      'unavailable',
    );
    const status = fixture.nativeElement.querySelector('.stop-list button .stop-status');
    expect(status.textContent).toBe('Indisponível');
    expect(status.closest('[hidden], [aria-hidden="true"]')).toBeNull();
    const selectors = fixture.nativeElement.querySelectorAll('.stop-selector');
    for (const selector of [selectors[0], selectors[1]]) {
      selector.click();
      fixture.detectChanges();
      const unavailable = fixture.nativeElement.querySelector('.stop-list button.unavailable');
      expect(unavailable.getAttribute('aria-disabled')).toBe('true');
      unavailable.click();
      fixture.detectChanges();
      expect(selector.textContent).toContain('Selecione local');
      expect(unavailable.getAttribute('aria-pressed')).toBe('false');
      expect(dialog.open).toBe(true);
    }
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
    const calendar = day.parentElement!;
    expect(calendar.getAttribute('role')).toBe('group');
    expect(calendar.getAttribute('aria-label')).toBe('Calendário');
    expect(calendar.querySelector('[aria-selected]')).toBeNull();
    expect(day.getAttribute('aria-pressed')).toBe('false');
    day.click();
    fixture.detectChanges();
    expect(day.getAttribute('aria-pressed')).toBe('true');
    expect(calendar.querySelectorAll('button[aria-pressed="true"]')).toHaveLength(1);
    (fixture.nativeElement.querySelector('.confirm-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    const expectedLabel = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(
      new Date(`${selectedDate}T00:00:00`),
    );
    expect(selectors[2].textContent).toContain(expectedLabel);
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('enables search only for complete, available routes', () => {
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    for (const picker of fixture.nativeElement.querySelectorAll('dialog')) {
      Object.assign(picker, {
        close: () => picker.removeAttribute('open'),
        showModal: () => picker.setAttribute('open', ''),
      });
    }
    const selectors = fixture.nativeElement.querySelectorAll('.stop-selector');
    const searchButton = fixture.nativeElement.querySelector('.search-button') as HTMLButtonElement;

    expect(searchButton.disabled).toBe(true);

    expect(fixture.nativeElement.querySelector('#search-unavailable')).toBeNull();
    expect(searchButton.hasAttribute('aria-describedby')).toBe(false);

    (selectors[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelectorAll('.stop-list button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    (selectors[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelectorAll('.stop-list button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    (selectors[2] as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[data-date="2026-01-31"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.confirm-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(searchButton.disabled).toBe(false);
    expect(fixture.nativeElement.querySelector('#search-unavailable')).toBeNull();

    (selectors[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.stop-list button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(searchButton.disabled).toBe(false);
    expect(selectors[1].textContent).toContain('Nova Andradina, MS');
    expect(dialog.open).toBe(true);
    expect(fixture.nativeElement.querySelector('#search-unavailable')).toBeNull();
    expect(searchButton.hasAttribute('aria-describedby')).toBe(false);
  });

  it('does not explain unavailable selections while stops are loading', () => {
    const loadingFixture = TestBed.createComponent(HomePage);
    loadingFixture.detectChanges();
    expect(loadingFixture.nativeElement.querySelector('.search-button').disabled).toBe(true);
    expect(loadingFixture.nativeElement.querySelector('#search-unavailable')).toBeNull();
    TestBed.inject(HttpTestingController)
      .expectOne('http://127.0.0.1:8000/api/stops')
      .flush([]);
    loadingFixture.destroy();
  });
});

describe('HomePage URL state', () => {
  let harness: RouterTestingHarness;
  let stops: Subject<Stop[]>;
  const cities: Stop[] = [
    {
      id: 'city',
      name: 'Available city',
      url: 'city',
      type: 'city',
      available: true,
      substops: [
        { id: 'station', name: 'Bus station', url: 'station', type: 'station', sub_type: null },
      ],
    },
    { id: 'unavailable', name: 'Unavailable city', url: 'unavailable', type: 'city', available: false },
  ];

  beforeEach(async () => {
    stops = new Subject<Stop[]>();
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '', component: HomePage }]),
        { provide: StopsService, useValue: { getStops: () => stops } },
      ],
    }).compileComponents();
    harness = await RouterTestingHarness.create();
  });

  async function open(url: string) {
    await harness.navigateByUrl(url, HomePage);
    stops.next(cities);
    stops.complete();
    harness.detectChanges();
    for (const dialog of harness.routeNativeElement!.querySelectorAll('dialog')) {
      Object.assign(dialog, {
        close: () => dialog.removeAttribute('open'),
        showModal: () => dialog.setAttribute('open', ''),
      });
    }
  }

  async function click(selector: string) {
    harness.routeNativeElement!.querySelector<HTMLButtonElement>(selector)!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  function labels() {
    return Array.from(
      harness.routeNativeElement!.querySelectorAll('.stop-selector'),
      (el) => el.textContent,
    );
  }

  it('restores city, station and date after stops load, and follows URL navigation', async () => {
    await open('/?from=station&to=city&date=2099-02-02');
    expect(labels()[0]).toContain('Bus station');
    expect(labels()[1]).toContain('Available city');
    expect(labels()[2]).toContain('2 de fevereiro de 2099');
    expect(harness.routeNativeElement!.querySelector<HTMLButtonElement>('.search-button')!.disabled).toBe(false);

    await harness.navigateByUrl('/?from=city', HomePage);
    expect(labels()[0]).toContain('Available city');
    expect(labels()[1]).toContain('Selecione local');
    expect(labels()[2]).toContain('Selecione a data de embarque');
  });

  it('mirrors stop selection, date confirmation and swap while preserving unrelated params', async () => {
    await open('/?campaign=test');
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate');
    await click('.stop-selector:nth-child(1)');
    await click('.stop-list button');
    expect(router.parseUrl(router.url).queryParams).toEqual({ campaign: 'test', from: 'city' });
    await click('.stop-selector:nth-child(2)');
    await click('.stop-list button');
    await click('.stop-selector:nth-child(3)');
    const day = harness.routeNativeElement!.querySelector<HTMLButtonElement>(
      '.calendar-day:not(:disabled):not(.outside-month)',
    )!;
    const date = day.dataset['date'];
    await click(`[data-date="${date}"]`);
    await click('.confirm-button');
    expect(router.parseUrl(router.url).queryParams).toEqual({
      campaign: 'test', from: 'city', to: 'station', date,
    });
    await click('.swap-stops');
    expect(router.parseUrl(router.url).queryParams).toEqual({
      campaign: 'test', from: 'station', to: 'city', date,
    });
    expect(labels()[0]).toContain('Bus station');
    expect(navigate).toHaveBeenLastCalledWith([], expect.objectContaining({ replaceUrl: true }));
  });

  it.each(['invalid', '2099-02-30', '2000-01-01'])('ignores unknown stops and invalid or expired date %s', async (date) => {
    await open(`/?from=missing&to=city&date=${date}`);
    expect(labels()[0]).toContain('Selecione local');
    expect(labels()[1]).toContain('Available city');
    expect(labels()[2]).toContain('Selecione a data de embarque');
    expect(harness.routeNativeElement!.querySelector<HTMLButtonElement>('.search-button')!.disabled).toBe(true);
  });

  it('keeps unavailable routes disabled and rejects duplicate endpoints', async () => {
    await open('/?from=unavailable&to=city&date=2099-02-02');
    expect(labels()[0]).toContain('Unavailable city');
    expect(harness.routeNativeElement!.querySelector<HTMLButtonElement>('.search-button')!.disabled).toBe(true);
    await harness.navigateByUrl('/?from=city&to=city&date=2099-02-02', HomePage);
    expect(labels()[1]).toContain('Selecione local');
    expect(harness.routeNativeElement!.querySelector<HTMLButtonElement>('.search-button')!.disabled).toBe(true);
  });
});
