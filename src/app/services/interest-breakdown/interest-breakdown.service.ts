import { Injectable } from '@angular/core';
import {
  ChartSlice,
  ColorCodeArea,
  InterestComponentItem,
  InterestComponentKind,
  ScheduleRow,
} from '../../model';
import { InterestComponentKindLabelPipe } from '../../pipes/interest-component-kind-label/interest-component-kind-label.pipe';
import { interestComponentNavigationTarget } from '../../helpers/form-navigation.helper';

@Injectable({ providedIn: 'root' })
export class InterestBreakdownService {
  private readonly componentKindLabel = new InterestComponentKindLabelPipe();

  /** Agreguje rozbicie odsetek wielu wierszy po rodzaju składnika (suma value == suma odsetek). */
  aggregateBreakdown(rows: ScheduleRow[]): InterestComponentItem[] {
    const sumByKind = new Map<InterestComponentKind, number>();
    for (const row of rows) {
      for (const item of row.interestBreakdown) {
        sumByKind.set(item.kind, (sumByKind.get(item.kind) ?? 0) + item.value);
      }
    }
    // Stała kolejność prezentacji składników
    return Object.values(InterestComponentKind)
      .filter((kind) => sumByKind.has(kind))
      .map((kind) => ({ kind, value: sumByKind.get(kind)! }));
  }

  /** true, gdy rozbicie zawiera składnik inny niż baza (pomostowe / niski wkład / promocja). */
  hasComponentBeyondBase(items: InterestComponentItem[]): boolean {
    return items.some((item) => item.kind !== InterestComponentKind.BASE);
  }

  /** mapuje rozbicie odsetek na ChartSlice[] (dzieci do rozwijanej sekcji legendy). */
  buildInterestChildren(items: InterestComponentItem[]): ChartSlice[] {
    return items
      .filter((item) => item.value !== 0)
      .map((item) => ({
        label: this.componentKindLabel.transform(item.kind),
        value: item.value,
        color: 'var(--c-int)',
        variant: ColorCodeArea.INTEREST,
        navigationTarget: interestComponentNavigationTarget(item.kind),
      }));
  }
}
