import { inject, Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Pipe({ name: 'formatRate', standalone: true })
export class FormatRatePipe implements PipeTransform {
  private readonly decimalPipe = inject(DecimalPipe);

  transform(value?: number): string | null {
    const formatted = this.decimalPipe.transform(value, '1.2-2');
    return formatted !== null ? `${formatted} %` : null;
  }
}
