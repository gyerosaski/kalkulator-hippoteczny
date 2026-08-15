import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { DividerVariant } from '../../../model';

@Component({
  selector: 'ui-divider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './divider.component.html',
  styleUrl: './divider.component.scss',
  host: {
    '[class.divider--no-padding]': '!padding()',
  },
})
export class DividerComponent {
  readonly variant = input<DividerVariant>(DividerVariant.DASHED);
  readonly padding = input<boolean>(true);
  protected readonly dividerVariant = DividerVariant;
}
