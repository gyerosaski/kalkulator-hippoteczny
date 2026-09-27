import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-plus',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-plus.component.html',
})
export class IconPlusComponent {}
