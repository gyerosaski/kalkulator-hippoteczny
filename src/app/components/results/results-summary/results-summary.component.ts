import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MortgageResults } from '../../../model/mortgage.model';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';

@Component({
  selector: 'app-results-summary',
  standalone: true,
  imports: [CommonModule, FormatAmountPipe],
  templateUrl: './results-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsSummaryComponent {
  results = input.required<MortgageResults | null>();
}
