import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { afterEach, vi } from 'vitest';
import { App } from './app';
import { routes } from './app.routes';

describe('App navigation focus', () => {
  beforeEach(() => {
    vi.stubGlobal('API_URL', 'http://127.0.0.1:8000');
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('focuses rendered main content on initial entry and each page activation', async () => {
    const fixture = TestBed.createComponent(App);
    const host: HTMLElement = fixture.nativeElement;
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    const focus = HTMLElement.prototype.focus;
    const renderedHeadings: (string | null | undefined)[] = [];
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (
      this: HTMLElement,
      options?: FocusOptions,
    ) {
      expect(this.isConnected).toBe(true);
      expect(this.getAttribute('tabindex')).toBe('-1');
      renderedHeadings.push(this.querySelector('h1')?.textContent);
      focus.call(this, options);
    });
    const outlet = fixture.debugElement.query(By.directive(RouterOutlet)).injector.get(RouterOutlet);
    const subscription = outlet.activateEvents.subscribe(() => {
      // Activation creates the component before its template has rendered.
      expect(focusSpy).not.toHaveBeenCalled();
    });

    for (const [url, heading] of [
      ['/', 'Escolha seu embarque'],
      ['/passagens?date=2026-10-12', '12 de outubro de 2026'],
      ['/assentos', 'Assentos da viagem'],
      ['/checkout', 'Revise sua viagem'],
      ['/', 'Escolha seu embarque'],
    ] as const) {
      focusSpy.mockClear();
      await router.navigateByUrl(url);
      await fixture.whenStable();

      expect(focusSpy).toHaveBeenCalledTimes(1);
      expect(renderedHeadings.at(-1)).toContain(heading);
      expect(document.activeElement).toBe(host.querySelector('main'));
    }
    subscription.unsubscribe();
  });

  it('preserves field focus on query-only updates and subsequent renders', async () => {
    const fixture = TestBed.createComponent(App);
    const host: HTMLElement = fixture.nativeElement;
    const router = TestBed.inject(Router);
    fixture.detectChanges();
    await router.navigateByUrl('/');
    await fixture.whenStable();

    TestBed.inject(HttpTestingController).expectOne('http://127.0.0.1:8000/api/stops').flush([]);
    await fixture.whenStable();

    const field = host.querySelector<HTMLButtonElement>('.stop-selector');
    if (!field) throw new Error('Origin selector not found');
    expect(field.disabled).toBe(false);
    field.focus();
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');

    for (const query of ['?from=ROD_1', '?from=ROD_1&to=ROD_2', '?date=2026-10-12']) {
      await router.navigateByUrl('/' + query);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(focusSpy).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(field);
    }
  });
});
