import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { BtnRemoveComponent } from '../btn-remove/btn-remove.component';

@Component({
  selector: 'ui-subsection',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BtnRemoveComponent],
  templateUrl: './subsection.component.html',
  styleUrl: './subsection.component.scss',
})
export class SubsectionComponent {
  readonly num = input.required<number | string>();
  readonly title = input<string>('');
  readonly removable = input<boolean>(false);
  readonly remove = output<void>();
}
