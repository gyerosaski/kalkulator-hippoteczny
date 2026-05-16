import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { DonutSlice } from '../../../model';

@Component({
  selector: 'ui-donut',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './donut.component.html',
  styleUrl: './donut.component.scss',
  animations: [
    trigger('valueChange', [
      transition('* => *', [
        style({ opacity: 0, transform: 'scale(0.85)' }),
        animate('280ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
    ]),
  ],
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
