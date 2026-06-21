import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-swap',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-swap.component.html',
})
export class IconSwapComponent {}
