import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="2" width="18" height="20" rx="3" fill="var(--accent-sage-deep)" />
      <rect x="6" y="5" width="12" height="4" rx="1" fill="white" />
      <rect x="6" y="12" width="3" height="3" rx="0.5" fill="white" />
      <rect x="10.5" y="12" width="3" height="3" rx="0.5" fill="white" />
      <rect x="15" y="12" width="3" height="3" rx="0.5" fill="white" />
      <rect x="6" y="17" width="3" height="3" rx="0.5" fill="white" />
      <rect x="10.5" y="17" width="3" height="3" rx="0.5" fill="white" />
      <rect x="15" y="17" width="3" height="3" rx="0.5" fill="white" />
    </svg>
  `,
})
export class IconCalculatorComponent {}
