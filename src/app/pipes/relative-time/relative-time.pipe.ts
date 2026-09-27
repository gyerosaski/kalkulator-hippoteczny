import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'relativeTime',
  standalone: true,
})
export class RelativeTimePipe implements PipeTransform {
  transform(date: Date | null): string {
    if (!date) return '—';
    const seconds = (Date.now() - date.getTime()) / 1000;
    if (seconds < 60) return 'przed chwilą';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min temu`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} godz. temu`;
    if (seconds < 86400 * 2) return 'wczoraj';
    if (seconds < 86400 * 7) return `${Math.floor(seconds / 86400)} dni temu`;
    if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400 / 7)} tyg. temu`;
    return `${Math.floor(seconds / 86400 / 30)} mies. temu`;
  }
}
