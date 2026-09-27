import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BadgeVariant } from '../../../model';

@Component({
  selector: 'ui-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
  host: {
    '[class.badge--green]': 'variant() === BadgeVariant.GREEN',
    '[class.badge--red]': 'variant() === BadgeVariant.RED',
    '[class.badge--neutral]': 'variant() === BadgeVariant.NEUTRAL',
    '[attr.title]': 'tooltip()',
  },
})
export class BadgeComponent {
  readonly label = input.required<string>();
  readonly variant = input.required<BadgeVariant>();
  readonly tooltip = input<string | null>(null);
  protected readonly BadgeVariant = BadgeVariant;
}
