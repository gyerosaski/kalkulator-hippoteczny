import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-chevron-right',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-chevron-right.component.html',
})
export class IconChevronRightComponent {}
