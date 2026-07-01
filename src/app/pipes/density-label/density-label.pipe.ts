import { Pipe, PipeTransform } from '@angular/core';
import { Density } from '../../model';

const LABELS: Record<Density, string> = {
  [Density.COZY]: 'kompaktowa',
  [Density.COMFORTABLE]: 'standardowa',
  [Density.ROOMY]: 'przestronna',
};

@Pipe({ name: 'densityLabel', standalone: true })
export class DensityLabelPipe implements PipeTransform {
  transform(value: Density): string;
  transform(value: readonly Density[]): string[];
  transform(value: Density | readonly Density[]): string | string[] {
    if (Array.isArray(value)) return value.map((density) => LABELS[density as Density]);
    return LABELS[value as Density];
  }
}
