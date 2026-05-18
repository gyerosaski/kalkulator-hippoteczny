import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'ui-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './field.component.html',
})
export class FieldComponent {
  label = input.required<string>();
  num = input<string>('');
  hint = input<string>('');
  inputId = input<string>('');
}
