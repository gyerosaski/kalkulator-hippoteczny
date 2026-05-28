import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { IconDownloadComponent } from '../../icons/icon-download/icon-download.component';

@Component({
  selector: 'app-calculations-footer',
  standalone: true,
  imports: [IconDownloadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calculations-footer.component.html',
  styleUrl: './calculations-footer.component.scss',
})
export class CalculationsFooterComponent {
  readonly filteredCount = input.required<number>();
  readonly totalCount = input.required<number>();
  readonly storePath = input<string | undefined>(undefined);

  readonly exportToFile = output<void>();
}
