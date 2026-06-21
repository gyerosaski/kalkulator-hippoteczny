import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-arrow-up',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-arrow-up.component.html',
})
export class IconArrowUpComponent {}
