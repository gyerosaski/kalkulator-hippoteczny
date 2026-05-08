import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { IconXComponent } from '../../icons/icon-x/icon-x.component';

@Component({
  selector: 'btn-remove',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconXComponent],
  templateUrl: './btn-remove.component.html',
  styleUrl: './btn-remove.component.scss',
})
export class BtnRemoveComponent {
  readonly remove = output<void>();
}
