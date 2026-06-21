import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-duplicate',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-duplicate.component.html',
})
export class IconDuplicateComponent {}
