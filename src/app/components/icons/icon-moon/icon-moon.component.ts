import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-moon',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-moon.component.html',
})
export class IconMoonComponent {}
