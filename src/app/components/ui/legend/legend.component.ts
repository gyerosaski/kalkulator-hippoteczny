import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { ChartSlice, LEGEND_TOTAL_ACTIVE, ToastVariant } from '../../../model';
import { ToastService } from '../../../services/toast/toast.service';
import { ColorCodeMarkerComponent } from '../color-code-marker/color-code-marker.component';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';

@Component({
  selector: 'ui-legend',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './legend.component.html',
  styleUrl: './legend.component.scss',
  imports: [ColorCodeMarkerComponent, FormatAmountPipe],
})
export class LegendComponent {
  private readonly toastService = inject(ToastService);

  slices = input.required<ChartSlice[]>();
  /** etykieta wiersza sumy nad legendą; gdy pusta — wiersz sumy i separator nie są renderowane. */
  totalLabel = input<string>('');
  activeLabel = input<string | null>(null);
  sliceHover = output<string | null>();

  protected readonly legendTotalActive = LEGEND_TOTAL_ACTIVE;

  private readonly expandedLabel = signal<string | null>(null);

  protected readonly legendTotal = computed(() =>
    this.slices().reduce((sum, slice) => sum + slice.value, 0),
  );

  protected onHover(label: string | null): void {
    this.sliceHover.emit(label);
  }

  protected toggleExpand(label: string): void {
    this.expandedLabel.update((current) => (current === label ? null : label));
  }

  protected isExpanded(label: string): boolean {
    return this.expandedLabel() === label;
  }

  protected copyAmount(value: number): void {
    const formatted = value.toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    navigator.clipboard.writeText(formatted).then(() => {
      this.toastService.show(`Wartość skopiowana do schowka`, ToastVariant.INFO);
    });
  }
}
