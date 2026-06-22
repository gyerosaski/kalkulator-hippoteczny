import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { DividerVariant } from '../../../model';

@Component({
  selector: 'ui-divider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './divider.component.html',
  styleUrl: './divider.component.scss',
})
export class DividerComponent {
  readonly variant = input<DividerVariant>(DividerVariant.DASHED);
  protected readonly dividerVariant = DividerVariant;
}
