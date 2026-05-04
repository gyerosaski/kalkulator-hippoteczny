import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sel">
      <select [value]="value()" (change)="valueChange.emit($any($event.target).value)">
        @for (o of options(); track o) { <option [value]="o">{{ o }}</option> }
      </select>
      <svg width="12" height="12" viewBox="0 0 12 12">
        <path d="M2 4 L6 8 L10 4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      </svg>
    </div>
  `,
})
export class SelectComponent {
  options = input.required<string[]>();
  value = input.required<string>();
  valueChange = output<string>();
}
