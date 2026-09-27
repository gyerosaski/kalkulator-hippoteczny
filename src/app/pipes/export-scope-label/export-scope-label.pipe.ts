import { Pipe, PipeTransform } from '@angular/core';
import { ExportScope } from '../../model';

const LABELS: Record<ExportScope, string> = {
  [ExportScope.PARAMETERS]: 'Parametry kalkulacji',
  [ExportScope.SCHEDULE]: 'Harmonogram spłaty',
};

@Pipe({ name: 'exportScopeLabel', standalone: true })
export class ExportScopeLabelPipe implements PipeTransform {
  transform(value: ExportScope): string;
  transform(value: readonly ExportScope[]): string[];
  transform(value: ExportScope | readonly ExportScope[]): string | string[] {
    if (Array.isArray(value)) return value.map((scope) => LABELS[scope as ExportScope]);
    return LABELS[value as ExportScope];
  }
}
