import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { DonutSlice, LEGEND_TOTAL_ACTIVE } from '../../../model';

@Component({
  selector: 'ui-donut',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './donut.component.html',
  styleUrl: './donut.component.scss',
})
export class DonutComponent {
  data = input.required<DonutSlice[]>();
  size = input<number>(200);
  thickness = input<number>(24);
  centerLabel = input<string>('');
  centerValue = input<string>('');
  activeLabel = input<string | null>(null);

  sliceHover = output<string | null>();

  /** Ile px grubości dodajemy aktywnemu wycinkowi przy najechaniu. */
  readonly activeStrokeBoost = 6;

  protected readonly isAllActive = computed(() => this.activeLabel() === LEGEND_TOTAL_ACTIVE);

  // TODO: Meaningful variable names
  r = computed(() => (this.size() - this.thickness() - this.activeStrokeBoost) / 2);
  c = computed(() => this.size() / 2);
  circ = computed(() => 2 * Math.PI * this.r());

  slices = computed(() => {
    const data = this.data();
    const total = data.reduce((sum, slice) => sum + slice.value, 0) || 1;
    let accumulated = 0;
    return data.map((slice) => {
      const length = (slice.value / total) * this.circ();
      const out = { slice, dasharray: `${length} ${this.circ() - length}`, offset: -accumulated };
      accumulated += length;
      return out;
    });
  });
}
