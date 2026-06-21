import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-chevron-down',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-chevron-down.component.html',
})
export class IconChevronDownComponent {}
