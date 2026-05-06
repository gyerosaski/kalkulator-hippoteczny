import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './field.component.html',
})
export class FieldComponent {
  label = input.required<string>();
  num = input<string>('');
  hint = input<string>('');
}
