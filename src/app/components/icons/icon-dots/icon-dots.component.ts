import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-dots',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-dots.component.html',
})
export class IconDotsComponent {}
