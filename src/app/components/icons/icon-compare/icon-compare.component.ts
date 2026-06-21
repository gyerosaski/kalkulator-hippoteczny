import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-compare',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-compare.component.html',
})
export class IconCompareComponent {}
