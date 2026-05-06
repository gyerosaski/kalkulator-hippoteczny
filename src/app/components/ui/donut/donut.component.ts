import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-donut',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './donut.component.html',
})
export class DonutComponent {
  data = input.required<DonutSlice[]>();
  size = input<number>(180);
  thickness = input<number>(26);
  centerLabel = input<string>('');
  centerValue = input<string>('');

  r = computed(() => (this.size() - this.thickness()) / 2);
  c = computed(() => this.size() / 2);
  circ = computed(() => 2 * Math.PI * this.r());

  slices = computed(() => {
    const data = this.data();
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    let acc = 0;
    return data.map((slice) => {
      const len = (slice.value / total) * this.circ();
      const out = { slice, dasharray: `${len} ${this.circ() - len}`, offset: -acc };
      acc += len;
      return out;
    });
  });
}
