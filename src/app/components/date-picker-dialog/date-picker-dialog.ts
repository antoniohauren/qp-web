import { Temporal } from '@js-temporal/polyfill';
import { Component, ElementRef, computed, input, output, signal, viewChild } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  imports: [MatIcon],
  selector: 'app-date-picker-dialog',
  styleUrl: './date-picker-dialog.scss',
  templateUrl: './date-picker-dialog.html',
})
export class DatePickerDialog {
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  readonly selectedDate = input('');
  readonly selected = output<string>();
  protected readonly minimumDate = signal(Temporal.Now.plainDateISO());
  protected readonly pendingDate = signal('');
  protected readonly activeMonth = signal(this.minimumDate().toPlainYearMonth());
  protected readonly monthLabel = computed(() =>
    this.activeMonth().toPlainDate({ day: 1 }).toLocaleString('pt-BR', {
      month: 'long',
      year: 'numeric',
    }),
  );
  protected readonly calendarDays = computed(() => {
    const month = this.activeMonth();
    const firstDay = month.toPlainDate({ day: 1 });
    const gridStart = firstDay.subtract({ days: firstDay.dayOfWeek % 7 });

    return Array.from({ length: 42 }, (_, index) => {
      const date = gridStart.add({ days: index });
      return {
        date,
        disabled: Temporal.PlainDate.compare(date, this.minimumDate()) < 0,
        outsideMonth: date.month !== month.month || date.year !== month.year,
      };
    });
  });
  protected readonly previousMonthDisabled = computed(
    () => Temporal.PlainYearMonth.compare(this.activeMonth(), this.minimumDate().toPlainYearMonth()) <= 0,
  );

  open() {
    this.pendingDate.set(this.selectedDate());
    this.refreshMinimumDate();
    this.activeMonth.set(
      this.pendingDate()
        ? Temporal.PlainDate.from(this.pendingDate()).toPlainYearMonth()
        : this.minimumDate().toPlainYearMonth(),
    );
    this.dialog().nativeElement.showModal();
  }

  protected changeMonth(months: number) {
    this.activeMonth.update((month) => month.add({ months }));
  }

  protected choose(date: Temporal.PlainDate) {
    this.refreshMinimumDate();
    if (Temporal.PlainDate.compare(date, this.minimumDate()) < 0) return;

    this.pendingDate.set(date.toString());
    this.activeMonth.set(date.toPlainYearMonth());
  }

  protected isSelected(date: Temporal.PlainDate) {
    return date.toString() === this.pendingDate();
  }

  protected confirm() {
    this.refreshMinimumDate();
    const date = this.pendingDate();
    if (!date) return;

    this.selected.emit(date);
    this.dialog().nativeElement.close();
  }

  private refreshMinimumDate() {
    const today = Temporal.Now.plainDateISO();
    this.minimumDate.set(today);
    if (this.pendingDate() && Temporal.PlainDate.compare(this.pendingDate(), today) < 0) {
      this.pendingDate.set('');
    }
    if (this.selectedDate() && Temporal.PlainDate.compare(this.selectedDate(), today) < 0) {
      this.selected.emit('');
    }
  }
}
