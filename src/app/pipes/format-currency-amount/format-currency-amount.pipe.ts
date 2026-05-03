import { inject, Pipe, PipeTransform } from '@angular/core';
import { FormatAmountPipe } from '../format-amount/format-amount.pipe';

@Pipe({
  name: 'formatCurrencyAmount',
})
export class FormatCurrencyAmountPipe implements PipeTransform {
  private readonly formatAmountPipe = inject(FormatAmountPipe);

  transform(value?: number): string | null {
    return `${this.formatAmountPipe.transform(value)} zł`;
  }
}
