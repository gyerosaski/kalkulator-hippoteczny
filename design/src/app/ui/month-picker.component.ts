import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MonthLabelPipe } from '../pipes/month-label.pipe';

@Component({
  selector: 'app-month-picker',
  standalone: true,
  imports: [MonthLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inp inp--date" [class.inp--disabled]="disabled()">
      <input type="text" [disabled]="disabled()" [value]="value() | monthLabel" readonly class="mono"/>
      <svg width="14" height="14" viewBox="0 0 14 14" class="cal-ico">
        <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" fill="none"/>
        <path d="M1.5 5.5 H12.5" stroke="currentColor"/>
        <path d="M4 1 V3.5 M10 1 V3.5" stroke="currentColor" stroke-linecap="round"/>
      </svg>
    </div>
  `,
})
export class MonthPickerComponent {
  value = input.required<Date>();
  disabled = input<boolean>(false);
}
