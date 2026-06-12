import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import {
  ChartSlice,
  FormSectionNavigationTarget,
  LEGEND_TOTAL_ACTIVE,
  LegendId,
  ToastVariant,
} from '../../../model';
import { ToastService } from '../../../services/toast/toast.service';
import { UiStateService } from '../../../services/ui-state/ui-state.service';
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
  private readonly uiStateService = inject(UiStateService);

  slices = input.required<ChartSlice[]>();
  /** Gdy ustawione, stan rozwinięcia pozycji jest trzymany w UiStateService i przeżywa zmianę widoku. */
  legendId = input<LegendId | null>(null);
  /** etykieta wiersza sumy nad legendą; gdy pusta — wiersz sumy i separator nie są renderowane. */
  totalLabel = input<string>('');
  /** etykieta wiersza stopki pod legendą; gdy pusta — wiersz stopki nie jest renderowany. */
  footerLabel = input<string>('');
  /** wartość liczbowa wiersza stopki (np. saldo na koniec roku). */
  footerValue = input<number | null>(null);
  activeLabel = input<string | null>(null);
  sliceHover = output<string | null>();

  protected readonly legendTotalActive = LEGEND_TOTAL_ACTIVE;

  private readonly localExpandedLabel = signal<string | null>(null);

  protected readonly legendTotal = computed(() =>
    this.slices().reduce((sum, slice) => sum + slice.value, 0),
  );

  protected onHover(label: string | null): void {
    this.sliceHover.emit(label);
  }

  protected toggleExpand(label: string): void {
    const legendId = this.legendId();
    if (legendId !== null) {
      this.uiStateService.toggleLegendLabel(legendId, label);
    } else {
      this.localExpandedLabel.update((current) => (current === label ? null : label));
    }
  }

  protected isExpanded(label: string): boolean {
    const legendId = this.legendId();
    const expandedLabel =
      legendId !== null
        ? this.uiStateService.expandedLegendLabel(legendId)()
        : this.localExpandedLabel();
    return expandedLabel === label;
  }

  /** Otwiera i przewija lewą kolumnę do sekcji formularza odpowiadającej pozycji legendy. */
  protected navigateTo(target: FormSectionNavigationTarget): void {
    this.uiStateService.revealFormSection(target);
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
