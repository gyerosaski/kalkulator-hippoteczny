import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MortgageResults } from '../../../model/mortgage.model';

@Component({
  selector: 'app-results-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsSummaryComponent {
  results = input.required<MortgageResults | null>();
}
