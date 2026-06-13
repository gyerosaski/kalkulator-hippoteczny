import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ExportFormat } from '../../../model';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { ExportFormatLabelPipe } from '../../../pipes/export-format-label/export-format-label.pipe';
import { IconDownloadComponent } from '../../icons/icon-download/icon-download.component';

@Component({
  selector: 'app-calculations-footer',
  standalone: true,
  imports: [DropdownComponent, ExportFormatLabelPipe, IconDownloadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calculations-footer.component.html',
  styleUrl: './calculations-footer.component.scss',
})
export class CalculationsFooterComponent {
  readonly filteredCount = input.required<number>();
  readonly totalCount = input.required<number>();
  readonly storePath = input<string | undefined>(undefined);

  readonly exportRequested = output<ExportFormat>();

  protected readonly exportFormatValues = Object.values(ExportFormat);
}
