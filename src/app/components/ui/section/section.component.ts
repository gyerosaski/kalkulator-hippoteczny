import { Component, ChangeDetectionStrategy, input, linkedSignal, output } from '@angular/core';
import { IconChevronRightComponent } from '../../icons/icon-chevron-right/icon-chevron-right.component';
import { ColorCodeArea } from '../../../model';
import { ColorCodeMarkerComponent } from '../color-code-marker/color-code-marker.component';

@Component({
  selector: 'ui-section',
  standalone: true,
  imports: [IconChevronRightComponent, ColorCodeMarkerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './section.component.html',
})
export class SectionComponent {
  title = input.required<string>();
  num = input<string>('');
  badge = input<string>('');
  marker = input<ColorCodeArea | null>(null);
  defaultOpen = input<boolean>(true);
  toggleable = input<boolean>(false);
  enabled = input<boolean>(true);
  enabledChange = output<boolean>();

  readonly open = linkedSignal(() => this.defaultOpen());

  isOff = () => this.toggleable() && !this.enabled();

  toggleOpen() {
    if (this.isOff()) return;
    this.open.update((value) => !value);
  }
}
