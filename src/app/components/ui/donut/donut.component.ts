import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  signal,
  viewChild,
  ElementRef,
  afterRenderEffect,
} from '@angular/core';
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
  /** Rozmiar donuta w px; w trybie `fluid` używany tylko zanim znany jest zmierzony rozmiar. */
  size = input<number>(216);
  /** Tryb płynny: donut wypełnia szerokość kontenera i skaluje się razem z nim. */
  fluid = input<boolean>(false);
  /** Grubość pierścienia w px ekranu (w trybie płynnym viewBox jest 1:1 ze zmierzonym rozmiarem). */
  thickness = input<number>(24);
  centerLabel = input<string>('');
  centerValue = input<string>('');
  activeLabel = input<string | null>(null);

  sliceHover = output<string | null>();

  /** Ile px grubości dodajemy aktywnemu wycinkowi przy najechaniu. */
  readonly activeStrokeBoost = 6;

  protected readonly isAllActive = computed(() => this.activeLabel() === LEGEND_TOTAL_ACTIVE);

  private readonly wrapElement = viewChild.required<ElementRef<HTMLDivElement>>('donutWrap');

  /** Zmierzona szerokość wrapa (tylko tryb płynny) — dzięki niej viewBox pracuje 1:1 z px ekranu. */
  private readonly measuredSize = signal<number | null>(null);

  protected readonly effectiveSize = computed(() =>
    this.fluid() ? (this.measuredSize() ?? this.size()) : this.size(),
  );

  r = computed(() => (this.effectiveSize() - this.thickness() - this.activeStrokeBoost) / 2);
  c = computed(() => this.effectiveSize() / 2);
  circ = computed(() => 2 * Math.PI * this.r());

  constructor() {
    afterRenderEffect((onCleanup) => {
      if (!this.fluid()) return;
      const observer = new ResizeObserver((entries) => {
        this.measuredSize.set(entries[0].contentRect.width);
      });
      observer.observe(this.wrapElement().nativeElement);
      onCleanup(() => observer.disconnect());
    });
  }

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
