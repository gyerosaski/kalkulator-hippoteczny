import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { IconTrashComponent } from '../../icons/icon-trash/icon-trash.component';

@Component({
  selector: 'ui-btn-remove',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconTrashComponent],
  templateUrl: './btn-remove.component.html',
  styleUrl: './btn-remove.component.scss',
})
export class BtnRemoveComponent {
  readonly remove = output<void>();
}
