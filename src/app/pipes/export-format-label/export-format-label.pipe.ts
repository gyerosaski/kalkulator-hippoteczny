import { Pipe, PipeTransform } from '@angular/core';
import { ExportFormat } from '../../model';

const LABELS: Record<ExportFormat, string> = {
  [ExportFormat.JSON]: 'JSON',
  [ExportFormat.CSV]: 'CSV',
};

@Pipe({ name: 'exportFormatLabel', standalone: true })
export class ExportFormatLabelPipe implements PipeTransform {
  transform(value: ExportFormat): string;
  transform(value: readonly ExportFormat[]): string[];
  transform(value: ExportFormat | readonly ExportFormat[]): string | string[] {
    if (Array.isArray(value)) return value.map((format) => LABELS[format as ExportFormat]);
    return LABELS[value as ExportFormat];
  }
}
