import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'formatExactDate', standalone: true })
export class FormatExactDatePipe implements PipeTransform {
  transform(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
