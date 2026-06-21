import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-delta',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-delta.component.html',
})
export class IconDeltaComponent {}
