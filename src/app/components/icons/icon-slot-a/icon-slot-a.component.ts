import { Component, ChangeDetectionStrategy, input } from '@angular/core';

import { IconSize } from '../../../model';

@Component({
  selector: 'icon-slot-a',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-slot-a.component.html',
  styleUrl: './icon-slot-a.component.scss',
})
export class IconSlotAComponent {
  readonly size = input<IconSize>(IconSize.REGULAR);

  protected readonly IconSize = IconSize;
}
