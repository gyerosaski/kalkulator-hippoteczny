import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { BtnRemoveComponent } from '../btn-remove/btn-remove.component';

@Component({
  selector: 'ui-subsec',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BtnRemoveComponent],
  templateUrl: './subsec.component.html',
  styleUrl: './subsec.component.scss',
})
export class SubsecComponent {
  readonly num = input.required<number | string>();
  readonly title = input<string>('');
  readonly removable = input<boolean>(false);
  readonly remove = output<void>();
}
