import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-info',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-info.component.html',
})
export class IconInfoComponent {}
