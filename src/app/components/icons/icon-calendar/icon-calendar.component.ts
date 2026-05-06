import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg width="14" height="14" viewBox="0 0 14 14" class="cal-ico">
      <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" fill="none" />
      <path d="M1.5 5.5 H12.5" stroke="currentColor" />
      <path d="M4 1 V3.5 M10 1 V3.5" stroke="currentColor" stroke-linecap="round" />
    </svg>
  `,
})
export class IconCalendarComponent {}
