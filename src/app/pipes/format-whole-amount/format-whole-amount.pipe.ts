import { inject, Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Pipe({ name: 'formatWholeAmount', standalone: true })
export class FormatWholeAmountPipe implements PipeTransform {
  private readonly decimalPipe = inject(DecimalPipe);

  transform(value?: number): string | null {
    return this.decimalPipe.transform(value, '1.0-0');
  }
}
