import { Pipe, PipeTransform } from '@angular/core';
import { monthLabel } from '../calc.service';

@Pipe({ name: 'monthLabel', standalone: true })
export class MonthLabelPipe implements PipeTransform {
  transform(value: Date | null | undefined): string {
    if (!value) return '—';
    return monthLabel(value);
  }
}
