import { Injectable } from '@angular/core';
import { ChartSlice, ColorCodeArea, OverheadCostItem, ScheduleRow } from '../../model';
import { OverheadCostKindLabelPipe } from '../../pipes/overhead-cost-kind-label/overhead-cost-kind-label.pipe';

@Injectable({ providedIn: 'root' })
export class OverheadCostBreakdownService {
  private readonly costKindLabel = new OverheadCostKindLabelPipe();

  /** agreguje rozbicie kosztów wielu wierszy po rodzaju (i nazwie dla kosztów dodatkowych). */
  aggregateBreakdown(rows: ScheduleRow[]): OverheadCostItem[] {
    const byKey = new Map<string, OverheadCostItem>();
    for (const row of rows) {
      for (const item of row.costBreakdown) {
        const key = item.name ? `${item.kind}:${item.name}` : item.kind;
        const existing = byKey.get(key);
        if (existing) {
          existing.value += item.value;
        } else {
          byKey.set(key, { kind: item.kind, name: item.name, value: item.value });
        }
      }
    }
    return [...byKey.values()];
  }

  /** mapuje rozbicie kosztów na ChartSlice[] (dzieci do rozwijanej sekcji legendy/donuta). */
  buildCostChildren(items: OverheadCostItem[]): ChartSlice[] {
    return items
      .filter((item) => item.value > 0)
      .map((item) => ({
        label: this.costKindLabel.transform(item),
        value: item.value,
        color: 'var(--c-cost)',
        variant: ColorCodeArea.COST,
      }));
  }
}
