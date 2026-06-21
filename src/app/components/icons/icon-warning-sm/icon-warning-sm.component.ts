import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-warning-sm',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-warning-sm.component.html',
})
export class IconWarningSmComponent {}
