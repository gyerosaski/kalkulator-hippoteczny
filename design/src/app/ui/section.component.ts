import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';

@Component({
  selector: 'app-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="sec" [class.is-open]="open()">
      <button class="sec-head" (click)="open.set(!open())">
        <span class="sec-chev">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M3 1 L7 5 L3 9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        @if (num()) { <span class="sec-num">{{ num() }}</span> }
        <span class="sec-title">{{ title() }}</span>
        @if (badge()) { <span class="sec-badge">{{ badge() }}</span> }
      </button>
      @if (open()) {
        <div class="sec-body"><ng-content/></div>
      }
    </section>
  `,
})
export class SectionComponent {
  title = input.required<string>();
  num = input<string>('');
  badge = input<string>('');
  defaultOpen = input<boolean>(true);

  open = signal(true);

  constructor() {
    queueMicrotask(() => this.open.set(this.defaultOpen()));
  }
}
