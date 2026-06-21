import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-check-circle',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-check-circle.component.html',
})
export class IconCheckCircleComponent {}
