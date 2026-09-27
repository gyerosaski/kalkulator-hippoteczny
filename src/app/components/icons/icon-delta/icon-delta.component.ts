import { Component, ChangeDetectionStrategy, input } from '@angular/core';

import { IconSize } from '../../../model';

@Component({
  selector: 'icon-delta',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-delta.component.html',
  styleUrl: './icon-delta.component.scss',
})
export class IconDeltaComponent {
  readonly size = input<IconSize>(IconSize.REGULAR);

  protected readonly IconSize = IconSize;
}
