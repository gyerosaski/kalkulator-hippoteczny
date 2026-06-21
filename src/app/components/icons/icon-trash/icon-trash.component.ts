import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-trash',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-trash.component.html',
})
export class IconTrashComponent {}
