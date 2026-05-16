import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SelectedMonthService {
  private readonly _selectedMonthIndex = signal<number | null>(null);

  readonly selectedMonthIndex = this._selectedMonthIndex.asReadonly();

  toggleSelectedMonth(rowIndex: number): void {
    this._selectedMonthIndex.update((current) => (current === rowIndex ? null : rowIndex));
  }

  clearSelectedMonth(): void {
    this._selectedMonthIndex.set(null);
  }
}
