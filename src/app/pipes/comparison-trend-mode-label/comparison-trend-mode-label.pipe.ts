import { Pipe, PipeTransform } from '@angular/core';
import { ComparisonTrendMode } from '../../model/comparison.model';

const LABELS: Record<ComparisonTrendMode, string> = {
  [ComparisonTrendMode.OVERLAY]: 'nakładka',
  [ComparisonTrendMode.SIDE_BY_SIDE]: 'obok siebie',
};

@Pipe({ name: 'comparisonTrendModeLabel', standalone: true })
export class ComparisonTrendModeLabelPipe implements PipeTransform {
  transform(value: ComparisonTrendMode): string;
  transform(value: readonly ComparisonTrendMode[]): string[];
  transform(value: ComparisonTrendMode | readonly ComparisonTrendMode[]): string | string[] {
    if (Array.isArray(value)) return value.map((mode) => LABELS[mode as ComparisonTrendMode]);
    return LABELS[value as ComparisonTrendMode];
  }
}
