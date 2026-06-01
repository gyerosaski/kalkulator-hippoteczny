import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';
import { ChartSlice } from '../../../model';
import { DonutComponent } from '../donut/donut.component';
import { ColorCodeMarkerComponent } from '../color-code-marker/color-code-marker.component';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';

@Component({
  selector: 'ui-donut-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './donut-chart.component.html',
  styleUrl: './donut-chart.component.scss',
  imports: [DonutComponent, ColorCodeMarkerComponent, FormatAmountPipe],
})
export class DonutChartComponent {
  slices = input.required<ChartSlice[]>();
  centerLabel = input<string>('');
  centerValue = input<string>('');
  /** etykieta wiersza sumy nad legendą; gdy pusta — wiersz sumy i separator nie są renderowane. */
  totalLabel = input<string>('');

  protected readonly activeSliceLabel = signal<string | null>(null);
  protected readonly expandedLabel = signal<string | null>(null);

  /** suma wartości slice'ów najwyższego poziomu (prezentowana nad legendą). */
  protected readonly legendTotal = computed(() =>
    this.slices().reduce((sum, slice) => sum + slice.value, 0),
  );

  protected setActiveSlice(label: string | null): void {
    this.activeSliceLabel.set(label);
  }

  protected toggleExpand(label: string): void {
    this.expandedLabel.update((current) => (current === label ? null : label));
  }

  protected isExpanded(label: string): boolean {
    return this.expandedLabel() === label;
  }
}
