import { afterRenderEffect, Component, ElementRef, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly activatedPage = signal<unknown>(null);

  constructor() {
    afterRenderEffect(() => {
      if (this.activatedPage()) {
        this.host.nativeElement
          .querySelector<HTMLElement>('main[tabindex="-1"]')
          ?.focus({ preventScroll: true });
      }
    });
  }
}
