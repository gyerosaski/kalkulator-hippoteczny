import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field">
      <label class="field-label">
        @if (num()) { <span class="field-num">{{ num() }}</span> }
        <span>{{ label() }}</span>
      </label>
      <ng-content/>
      @if (hint()) { <div class="field-hint">{{ hint() }}</div> }
    </div>
  `,
})
export class FieldComponent {
  label = input.required<string>();
  num = input<string>('');
  hint = input<string>('');
}
