import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-chevron-right',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg width="10" height="10" viewBox="0 0 10 10">
      <path
        d="M3 1 L7 5 L3 9"
        stroke="currentColor"
        stroke-width="1.5"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `,
})
export class IconChevronRightComponent {}
