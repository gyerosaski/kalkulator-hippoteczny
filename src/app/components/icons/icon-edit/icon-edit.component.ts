import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-edit',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-edit.component.html',
})
export class IconEditComponent {}
