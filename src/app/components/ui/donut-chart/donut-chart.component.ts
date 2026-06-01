import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { ChartSlice } from '../../../model';
import { DonutComponent } from '../donut/donut.component';
import { ColorCodeMarkerComponent } from '../color-code-marker/color-code-marker.component';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';

@Component({
  selector: 'ui-donut-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './donut-chart.component.html',
  styleUrl: './donut-chart.component.scss',
  imports: [DonutComponent, ColorCodeMarkerComponent, FormatAmountPipe],
})
export class DonutChartComponent {
  slices = input.required<ChartSlice[]>();
  centerLabel = input<string>('');
  centerValue = input<string>('');

  protected readonly activeSliceLabel = signal<string | null>(null);

  protected setActiveSlice(label: string | null): void {
    this.activeSliceLabel.set(label);
  }
}
