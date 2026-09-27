import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-download',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-download.component.html',
})
export class IconDownloadComponent {}
