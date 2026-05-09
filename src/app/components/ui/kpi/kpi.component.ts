import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';

@Component({
  selector: 'ui-kpi',
  standalone: true,
  imports: [FormatAmountPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'kpi' },
  templateUrl: './kpi.component.html',
})
export class KpiComponent {
  label = input.required<string>();
  value = input<number | undefined>(undefined);
  unit = input<string>('zł');
}
