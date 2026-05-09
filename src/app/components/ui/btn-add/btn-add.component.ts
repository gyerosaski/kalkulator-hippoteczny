import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'ui-btn-add',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './btn-add.component.html',
})
export class BtnAddComponent {
  readonly label = input.required<string>();
  readonly add = output<void>();
}
