import { TestBed } from '@angular/core/testing';
import { afterEach, vi } from 'vitest';
import { DatePickerDialog } from './date-picker-dialog';

describe('DatePickerDialog', () => {
  afterEach(() => vi.useRealTimers());

  it('includes the weekday and full date in date button accessible labels', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 0, 31, 12));
    await TestBed.configureTestingModule({ imports: [DatePickerDialog] }).compileComponents();
    const fixture = TestBed.createComponent(DatePickerDialog);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('[data-date="2026-01-31"]')?.getAttribute('aria-label')).toBe(
      'sábado, 31 de janeiro de 2026',
    );
  });
});
