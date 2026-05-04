import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'pln', standalone: true })
export class PlnPipe implements PipeTransform {
  transform(value: number | null | undefined, decimals = 2): string {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }
}
