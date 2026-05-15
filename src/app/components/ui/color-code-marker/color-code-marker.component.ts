import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export enum ColorCodeMarkerVariant {
  CAPITAL = 'CAPITAL',
  INTEREST = 'INTEREST',
  COST = 'COST',
  PREPAYMENT = 'PREPAYMENT',
}

const COLOR_MAP: Record<ColorCodeMarkerVariant, string> = {
  [ColorCodeMarkerVariant.CAPITAL]: 'var(--c-cap)',
  [ColorCodeMarkerVariant.INTEREST]: 'var(--c-int)',
  [ColorCodeMarkerVariant.COST]: 'var(--c-cost)',
  [ColorCodeMarkerVariant.PREPAYMENT]: 'var(--c-over)',
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
  variant = input.required<ColorCodeMarkerVariant>();
  protected readonly background = computed(() => COLOR_MAP[this.variant()]);
}
