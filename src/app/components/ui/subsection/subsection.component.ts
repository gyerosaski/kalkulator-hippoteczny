import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { BtnRemoveComponent } from '../btn-remove/btn-remove.component';
import { IconChevronRightComponent } from '../../icons/icon-chevron-right/icon-chevron-right.component';
import { ColorCodeMarkerVariant } from '../../../model';

const NUM_COLOR_MAP: Record<
  ColorCodeMarkerVariant,
  { color: string; background: string; ring: string }
> = {
  [ColorCodeMarkerVariant.CAPITAL]: {
    color: 'var(--c-cap)',
    background: 'var(--c-cap-soft)',
    ring: 'var(--c-cap-mid)',
  },
  [ColorCodeMarkerVariant.INTEREST]: {
    color: 'var(--c-int)',
    background: 'var(--c-int-soft)',
    ring: 'var(--c-int-mid)',
  },
  [ColorCodeMarkerVariant.COST]: {
    color: 'var(--c-cost)',
    background: 'var(--c-cost-soft)',
    ring: 'var(--c-cost-mid)',
  },
  [ColorCodeMarkerVariant.PREPAYMENT]: {
    color: 'var(--c-over)',
    background: 'var(--c-over-soft)',
    ring: 'var(--c-over-soft)',
  },
};

@Component({
  selector: 'ui-subsection',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BtnRemoveComponent, IconChevronRightComponent],
  templateUrl: './subsection.component.html',
  styleUrl: './subsection.component.scss',
  host: {
    '[style.--num-color]': 'numColor()',
    '[style.--num-bg]': 'numBg()',
    '[style.--num-ring]': 'numRing()',
  },
})
export class SubsectionComponent {
  readonly num = input.required<number | string>();
  readonly title = input<string>('');
  readonly open = input<boolean>(false);
  readonly openChange = output<boolean>();
  readonly removable = input<boolean>(false);
  readonly remove = output<void>();
  readonly context = input<ColorCodeMarkerVariant | null>(null);

  protected readonly numColor = computed(() => {
    const ctx = this.context();
    return ctx ? NUM_COLOR_MAP[ctx].color : null;
  });

  protected readonly numBg = computed(() => {
    const ctx = this.context();
    return ctx ? NUM_COLOR_MAP[ctx].background : null;
  });

  protected readonly numRing = computed(() => {
    const ctx = this.context();
    return ctx ? NUM_COLOR_MAP[ctx].ring : null;
  });
}
