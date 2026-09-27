import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'formatLoanPeriod', standalone: true })
export class FormatLoanPeriodPipe implements PipeTransform {
  transform(years: number, extraMonths = 0): string {
    if (extraMonths === 0) {
      return `${years} lat`;
    }
    return `${years} l. ${extraMonths} m-cy`;
  }
}
