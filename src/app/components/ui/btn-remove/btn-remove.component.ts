import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { IconMinusComponent } from '../../icons/icon-minus/icon-minus.component';

@Component({
  selector: 'btn-remove',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconMinusComponent],
  templateUrl: './btn-remove.component.html',
  styleUrl: './btn-remove.component.scss',
})
export class BtnRemoveComponent {
  readonly remove = output<void>();
}
