import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatMonthPl',
  standalone: true,
})
export class FormatMonthPlPipe implements PipeTransform {
  transform(month: string | null | undefined): string {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) return '';
    const [y, m] = month.split('-').map((v) => parseInt(v, 10));
    const d = new Date(y, m - 1, 1);
    return new Intl.DateTimeFormat('pl-PL', { month: 'short', year: 'numeric' }).format(d);
  }
}
