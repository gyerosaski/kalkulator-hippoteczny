import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-export',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-export.component.html',
})
export class IconExportComponent {}
