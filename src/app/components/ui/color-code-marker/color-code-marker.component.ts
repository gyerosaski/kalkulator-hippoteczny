import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { ColorCodeArea } from '../../../model';

const COLOR_MAP: Record<ColorCodeArea, string> = {
  [ColorCodeArea.CAPITAL]: 'var(--c-cap)',
  [ColorCodeArea.INTEREST]: 'var(--c-int)',
  [ColorCodeArea.COST]: 'var(--c-cost)',
  [ColorCodeArea.PREPAYMENT]: 'var(--c-over)',
};

@Component({
  selector: 'ui-color-code-marker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './color-code-marker.component.html',
  styleUrl: './color-code-marker.component.scss',
  host: { '[style.background]': 'background()' },
})
export class ColorCodeMarkerComponent {
  variant = input.required<ColorCodeArea>();
  protected readonly background = computed(() => COLOR_MAP[this.variant()]);
}
