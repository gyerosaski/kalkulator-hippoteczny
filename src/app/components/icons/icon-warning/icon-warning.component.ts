import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-warning',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-warning.component.html',
})
export class IconWarningComponent {}
