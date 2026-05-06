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
  template: `
    <div class="donut-wrap" [style.width.px]="size()" [style.height.px]="size()">
      <svg [attr.width]="size()" [attr.height]="size()">
        <circle
          [attr.cx]="c()"
          [attr.cy]="c()"
          [attr.r]="r()"
          fill="none"
          stroke="var(--track)"
          [attr.stroke-width]="thickness()"
        />
        @for (s of slices(); track s.slice.label) {
          <circle
            [attr.cx]="c()"
            [attr.cy]="c()"
            [attr.r]="r()"
            fill="none"
            [attr.stroke]="s.slice.color"
            [attr.stroke-width]="thickness()"
            [attr.stroke-dasharray]="s.dasharray"
            [attr.stroke-dashoffset]="s.offset"
            [attr.transform]="'rotate(-90 ' + c() + ' ' + c() + ')'"
          />
        }
      </svg>
      <div class="donut-center">
        <div class="donut-label">{{ centerLabel() }}</div>
        <div class="donut-value mono">{{ centerValue() }}</div>
      </div>
    </div>
  `,
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
