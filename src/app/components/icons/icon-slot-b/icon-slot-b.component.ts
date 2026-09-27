import { Component, ChangeDetectionStrategy, input } from '@angular/core';

import { IconSize } from '../../../model';

@Component({
  selector: 'icon-slot-b',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-slot-b.component.html',
  styleUrl: './icon-slot-b.component.scss',
})
export class IconSlotBComponent {
  readonly size = input<IconSize>(IconSize.REGULAR);

  protected readonly IconSize = IconSize;
}
