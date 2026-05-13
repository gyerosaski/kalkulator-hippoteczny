import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { BtnRemoveComponent } from '../btn-remove/btn-remove.component';
import { IconChevronRightComponent } from '../../icons/icon-chevron-right/icon-chevron-right.component';

@Component({
  selector: 'ui-subsection',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BtnRemoveComponent, IconChevronRightComponent],
  templateUrl: './subsection.component.html',
  styleUrl: './subsection.component.scss',
})
export class SubsectionComponent {
  readonly num = input.required<number | string>();
  readonly title = input<string>('');
  readonly open = input<boolean>(false);
  readonly openChange = output<boolean>();
  readonly removable = input<boolean>(false);
  readonly remove = output<void>();
}
