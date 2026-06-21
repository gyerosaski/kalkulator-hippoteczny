import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-search',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-search.component.html',
})
export class IconSearchComponent {}
