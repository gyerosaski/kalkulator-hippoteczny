import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-arrow-right',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-arrow-right.component.html',
})
export class IconArrowRightComponent {}
