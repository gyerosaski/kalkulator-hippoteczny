import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-sun',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-sun.component.html',
})
export class IconSunComponent {}
