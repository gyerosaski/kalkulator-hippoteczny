import { Injectable, Signal, signal, WritableSignal } from '@angular/core';

import {
  FormSectionId,
  FormSectionNavigationTarget,
  LegendId,
  SavedCalculationSortOption,
  SortDirection,
} from '../../model';
import { formSectionAnchorId } from '../../helpers/form-navigation.helper';
import { DEFAULT_SORT_DIRECTIONS } from '../../helpers/saved-calculation-sort.helper';

/**
 * Centralny, trzymany w pamięci stan UI (rozwinięcia sekcji, podsekcji, legend,
 * zaznaczenia w harmonogramie i na wykresach). Dzięki `providedIn: 'root'`
 * stan przeżywa przełączanie widoków w ramach sesji aplikacji.
 */
@Injectable({ providedIn: 'root' })
export class UiStateService {
  private readonly sectionOpenStates = new Map<FormSectionId, WritableSignal<boolean>>();
  private readonly sectionDefaultOpen = new Map<FormSectionId, boolean>();
  private readonly openSubsections = new Map<FormSectionId, WritableSignal<string | null>>();
  private readonly expandedLegendLabels = new Map<LegendId, WritableSignal<string | null>>();

  private readonly _expandedScheduleYear = signal<number | null>(null);
  readonly expandedScheduleYear = this._expandedScheduleYear.asReadonly();

  private readonly _selectedTrendYearIndex = signal<number | null>(null);
  readonly selectedTrendYearIndex = this._selectedTrendYearIndex.asReadonly();

  private readonly _selectedMonthIndex = signal<number | null>(null);
  readonly selectedMonthIndex = this._selectedMonthIndex.asReadonly();

  private readonly _calculatorFormColumnScrollTop = signal(0);
  readonly calculatorFormColumnScrollTop = this._calculatorFormColumnScrollTop.asReadonly();

  private readonly _calculatorResultsColumnScrollTop = signal(0);
  readonly calculatorResultsColumnScrollTop = this._calculatorResultsColumnScrollTop.asReadonly();

  private readonly _savedCalculationsSortOption = signal<SavedCalculationSortOption>(
    SavedCalculationSortOption.UPDATED,
  );

  readonly savedCalculationsSortOption = this._savedCalculationsSortOption.asReadonly();

  private readonly _savedCalculationsSortDirection = signal<SortDirection>(
    DEFAULT_SORT_DIRECTIONS[SavedCalculationSortOption.UPDATED],
  );

  readonly savedCalculationsSortDirection = this._savedCalculationsSortDirection.asReadonly();

  sectionOpen(sectionId: FormSectionId, defaultOpen = true): Signal<boolean> {
    if (!this.sectionDefaultOpen.has(sectionId)) {
      this.sectionDefaultOpen.set(sectionId, defaultOpen);
    }
    return this.sectionOpenState(sectionId, defaultOpen).asReadonly();
  }

  setSectionOpen(sectionId: FormSectionId, open: boolean): void {
    this.sectionOpenState(sectionId, open).set(open);
  }

  toggleSection(sectionId: FormSectionId, defaultOpen = true): void {
    this.sectionOpenState(sectionId, defaultOpen).update((open) => !open);
  }

  openSubsection(sectionId: FormSectionId): Signal<string | null> {
    return this.openSubsectionState(sectionId).asReadonly();
  }

  setOpenSubsection(sectionId: FormSectionId, subsectionKey: string | null): void {
    this.openSubsectionState(sectionId).set(subsectionKey);
  }

  expandedLegendLabel(legendId: LegendId): Signal<string | null> {
    return this.expandedLegendLabelState(legendId).asReadonly();
  }

  toggleLegendLabel(legendId: LegendId, label: string): void {
    this.expandedLegendLabelState(legendId).update((current) => (current === label ? null : label));
  }

  /** Otwiera sekcję (i opcjonalnie podsekcję) formularza, po czym przewija do niej lewą kolumnę. */
  revealFormSection(target: FormSectionNavigationTarget): void {
    this.setSectionOpen(target.sectionId, true);
    if (target.subsectionKey !== undefined) {
      this.setOpenSubsection(target.sectionId, target.subsectionKey);
    }
    requestAnimationFrame(() => {
      document
        .getElementById(formSectionAnchorId(target.sectionId))
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /** Ustawia kryterium sortowania listy kalkulacji i resetuje kierunek do domyślnego dla tego kryterium. */
  setSavedCalculationsSortOption(sortOption: SavedCalculationSortOption): void {
    this._savedCalculationsSortOption.set(sortOption);
    this._savedCalculationsSortDirection.set(DEFAULT_SORT_DIRECTIONS[sortOption]);
  }

  toggleSavedCalculationsSortDirection(): void {
    this._savedCalculationsSortDirection.update((direction) =>
      direction === SortDirection.ASCENDING ? SortDirection.DESCENDING : SortDirection.ASCENDING,
    );
  }

  toggleScheduleYear(year: number): void {
    this._expandedScheduleYear.update((current) => (current === year ? null : year));
  }

  toggleTrendYear(yearIndex: number): void {
    this._selectedTrendYearIndex.update((current) => (current === yearIndex ? null : yearIndex));
  }

  toggleSelectedMonth(rowIndex: number): void {
    this._selectedMonthIndex.update((current) => (current === rowIndex ? null : rowIndex));
  }

  clearSelectedMonth(): void {
    this._selectedMonthIndex.set(null);
  }

  setCalculatorFormColumnScrollTop(scrollTop: number): void {
    this._calculatorFormColumnScrollTop.set(scrollTop);
  }

  setCalculatorResultsColumnScrollTop(scrollTop: number): void {
    this._calculatorResultsColumnScrollTop.set(scrollTop);
  }

  /**
   * Zachowuje zaznaczony miesiąc przy przeliczeniu/powrocie do widoku, czyszcząc go tylko gdy
   * indeks (1-based) wykracza poza nowy harmonogram. Dzięki temu zaznaczenie i rozwinięte
   * pozycje legendy nie giną przy przełączaniu zakładek, a same przeżywają zmianę widoku
   * (stan trzymany w singletonie `providedIn: 'root'`).
   */
  clampSelectedMonth(scheduleLength: number): void {
    this._selectedMonthIndex.update((current) =>
      current !== null && (current < 1 || current > scheduleLength) ? null : current,
    );
  }

  /**
   * Czyści stan UI związany z konkretną kalkulacją: zaznaczenia w wynikach, rozwinięte podsekcje,
   * pozycje legendy oraz stan rozwinięcia sekcji wraca do wartości domyślnych. Preferencje sortowania
   * listy kalkulacji pozostają nietknięte. Mutuje istniejące sygnały (nie podmienia ich), aby nie
   * zerwać powiązań trzymanych w komponentach.
   */
  resetCalculationViewState(): void {
    this._selectedMonthIndex.set(null);
    this._expandedScheduleYear.set(null);
    this._selectedTrendYearIndex.set(null);
    this._calculatorFormColumnScrollTop.set(0);
    this._calculatorResultsColumnScrollTop.set(0);
    this.openSubsections.forEach((state) => state.set(null));
    this.expandedLegendLabels.forEach((state) => state.set(null));
    this.sectionOpenStates.forEach((state, sectionId) =>
      state.set(this.sectionDefaultOpen.get(sectionId) ?? true),
    );
  }

  private sectionOpenState(
    sectionId: FormSectionId,
    defaultOpen: boolean,
  ): WritableSignal<boolean> {
    let state = this.sectionOpenStates.get(sectionId);
    if (!state) {
      state = signal(defaultOpen);
      this.sectionOpenStates.set(sectionId, state);
    }
    return state;
  }

  private openSubsectionState(sectionId: FormSectionId): WritableSignal<string | null> {
    let state = this.openSubsections.get(sectionId);
    if (!state) {
      state = signal<string | null>(null);
      this.openSubsections.set(sectionId, state);
    }
    return state;
  }

  private expandedLegendLabelState(legendId: LegendId): WritableSignal<string | null> {
    let state = this.expandedLegendLabels.get(legendId);
    if (!state) {
      state = signal<string | null>(null);
      this.expandedLegendLabels.set(legendId, state);
    }
    return state;
  }
}
