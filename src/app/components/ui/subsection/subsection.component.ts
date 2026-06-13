import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { IconChevronRightComponent } from '../../icons/icon-chevron-right/icon-chevron-right.component';
import { ColorCodeMarkerComponent } from '../color-code-marker/color-code-marker.component';
import { ColorCodeArea } from '../../../model';

@Component({
  selector: 'ui-subsection',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconChevronRightComponent, ColorCodeMarkerComponent],
  templateUrl: './subsection.component.html',
  styleUrl: './subsection.component.scss',
})
export class SubsectionComponent {
  readonly num = input.required<number | string>();
  readonly title = input<string>('');
  readonly open = input<boolean>(false);
  readonly openChange = output<boolean>();
  readonly context = input<ColorCodeArea | null>(null);
}
