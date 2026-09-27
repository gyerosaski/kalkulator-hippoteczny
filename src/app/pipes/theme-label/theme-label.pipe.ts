import { Pipe, PipeTransform } from '@angular/core';
import { Theme } from '../../model';

const LABELS: Record<Theme, string> = {
  [Theme.LIGHT]: 'jasny',
  [Theme.DARK]: 'ciemny',
  [Theme.OCHRA]: 'ochra',
};

@Pipe({ name: 'themeLabel', standalone: true })
export class ThemeLabelPipe implements PipeTransform {
  transform(value: Theme): string;
  transform(value: readonly Theme[]): string[];
  transform(value: Theme | readonly Theme[]): string | string[] {
    if (Array.isArray(value)) return value.map((theme) => LABELS[theme as Theme]);
    return LABELS[value as Theme];
  }
}
