import { Component, inject } from '@angular/core';
import { FormService } from '../../../services/form/form';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';
import { FormatCurrencyAmountPipe } from '../../../pipes/format-currency-amount/format-currency-amount.pipe';

@Component({
  selector: 'app-results-errors',
  imports: [FormatAmountPipe, FormatCurrencyAmountPipe],
  templateUrl: './results-errors.component.html',
  styleUrl: './results-errors.component.scss',
})
export class ResultsErrorsComponent {
  private readonly formService = inject(FormService);

  get form() {
    return this.formService.form;
  }

  get hasInvalidTrancheAmount() {
    return this.formService.transzeArray.controls.some((c) => c.get('amount')?.invalid);
  }

  get hasInvalidDisbursementFee() {
    return this.formService.transzeArray.controls.some(
      (c) => c.get('disbursementFee')?.errors?.['max'],
    );
  }
}
