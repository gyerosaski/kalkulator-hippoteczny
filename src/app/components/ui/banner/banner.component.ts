import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BannerVariant } from '../../../model';
import { IconInfoComponent } from '../../icons/icon-info/icon-info.component';
import { IconWarningComponent } from '../../icons/icon-warning/icon-warning.component';

@Component({
  selector: 'ui-banner',
  standalone: true,
  imports: [IconInfoComponent, IconWarningComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.scss',
  host: {
    role: 'status',
    '[class.banner--info]': 'variant() === BannerVariant.INFO',
    '[class.banner--warning]': 'variant() === BannerVariant.WARNING',
  },
})
export class BannerComponent {
  readonly variant = input.required<BannerVariant>();
  protected readonly BannerVariant = BannerVariant;
}
