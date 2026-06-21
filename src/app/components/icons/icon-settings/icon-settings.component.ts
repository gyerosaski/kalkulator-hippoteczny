import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-settings',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-settings.component.html',
})
export class IconSettingsComponent {}
