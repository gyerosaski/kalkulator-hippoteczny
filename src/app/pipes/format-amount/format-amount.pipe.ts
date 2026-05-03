import { inject, Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Pipe({
  name: 'formatAmount',
})
export class FormatAmountPipe implements PipeTransform {
  private readonly decimalPipe = inject(DecimalPipe);

  transform(value?: number): string | null {
    return this.decimalPipe.transform(value, '1.2-2');
  }
}
