import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-x',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-x.component.html',
})
export class IconXComponent {}
