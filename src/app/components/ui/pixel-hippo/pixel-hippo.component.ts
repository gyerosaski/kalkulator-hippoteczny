import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-pixel-hippo',
  standalone: true,
  templateUrl: './pixel-hippo.component.html',
  styleUrls: ['./pixel-hippo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PixelHippoComponent {}
