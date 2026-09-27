import { Injectable, Signal, signal, WritableSignal } from '@angular/core';

import {
  FormSectionId,
  FormSectionNavigationTarget,
  LegendId,
  SavedCalculationSortOption,
  SortDirection,
} from '../../model';
import {
  formListItemAnchorId,
  formSectionAnchorId,
  formSubsectionAnchorId,
} from '../../helpers/form-navigation.helper';
import { DEFAULT_SORT_DIRECTIONS } from '../../helpers/saved-calculation-sort.helper';

/**
 * Centralny, trzymany w pamięci stan UI (rozwinięcia sekcji, podsekcji, legend,
 * zaznaczenia w harmonogramie i na wykresach). Dzięki `providedIn: 'root'`
 * stan przeżywa przełączanie widoków w ramach sesji aplikacji.
 */
@Injectable({ providedIn: 'root' })
export class UiStateService {
  /** Zapas czasowy na animację rozwijania sekcji (`--duration-slow`), gdyby `transitionend` nie nadszedł. */
  private static readonly SECTION_EXPANSION_FALLBACK_MS = 450;
  /** Musi pokrywać czas animacji `.title-pulse` zdefiniowanej w `styles.scss`. */
  private static readonly NAVIGATION_HIGHLIGHT_DURATION_MS = 2000;

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

  private readonly _highlightedNavigationTarget = signal<FormSectionNavigationTarget | null>(null);
  /** Cel ostatniej nawigacji legenda → formularz; przez chwilę po przewinięciu wyróżnia tytuł sekcji/podsekcji. */
  readonly highlightedNavigationTarget = this._highlightedNavigationTarget.asReadonly();

  private navigationHighlightResetHandle: ReturnType<typeof setTimeout> | null = null;

  private readonly _calculatorFormColumnScrollTop = signal(0);
  readonly calculatorFormColumnScrollTop = this._calculatorFormColumnScrollTop.asReadonly();

  private readonly _calculatorResultsColumnScrollTop = signal(0);
  readonly calculatorResultsColumnScrollTop = this._calculatorResultsColumnScrollTop.asReadonly();

  private readonly _calculationsManagerScrollTop = signal(0);
  readonly calculationsManagerScrollTop = this._calculationsManagerScrollTop.asReadonly();

  private readonly _calculationsCompareScrollTop = signal(0);
  readonly calculationsCompareScrollTop = this._calculationsCompareScrollTop.asReadonly();

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

  /**
   * Otwiera sekcję (i opcjonalnie podsekcję) formularza, przewija do niej lewą kolumnę
   * i na chwilę wyróżnia tytuł celu. Gdy sekcja była zwinięta, przewinięcie startuje dopiero
   * po zakończeniu animacji rozwijania — wcześniej pozycja celu jeszcze się przesuwa.
   */
  revealFormSection(target: FormSectionNavigationTarget): void {
    const sectionWasOpen = this.sectionOpenState(target.sectionId, true)();
    this.setSectionOpen(target.sectionId, true);
    if (target.subsectionKey !== undefined) {
      this.setOpenSubsection(target.sectionId, target.subsectionKey);
    }
    requestAnimationFrame(() => {
      const sectionElement = document.getElementById(formSectionAnchorId(target.sectionId));
      if (!sectionElement) {
        return;
      }
      const scrollToTarget = () => {
        const itemElement =
          target.subsectionKey !== undefined && target.itemKey !== undefined
            ? document.getElementById(
                formListItemAnchorId(target.sectionId, target.subsectionKey, target.itemKey),
              )
            : null;
        const subsectionElement =
          target.subsectionKey !== undefined
            ? document.getElementById(
                formSubsectionAnchorId(target.sectionId, target.subsectionKey),
              )
            : null;
        // element listy lub podsekcję centrujemy w widoku; samą sekcję dosuwamy do góry, żeby nie chować jej nagłówka
        const centeredElement = itemElement ?? subsectionElement;
        if (centeredElement) {
          centeredElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // gdy element listy zniknął (np. zmieniono nazwę), wyróżnienie spada na tytuł podsekcji
        const highlightTarget =
          target.itemKey !== undefined && itemElement === null
            ? { sectionId: target.sectionId, subsectionKey: target.subsectionKey }
            : target;
        this.triggerNavigationHighlight(highlightTarget);
      };
      if (sectionWasOpen) {
        scrollToTarget();
      } else {
        this.runAfterSectionExpansion(sectionElement, scrollToTarget);
      }
    });
  }

  /** Wywołuje `callback` po zakończeniu animacji rozwijania sekcji (z awaryjnym timeoutem). */
  private runAfterSectionExpansion(sectionElement: HTMLElement, callback: () => void): void {
    const sectionBody = sectionElement.querySelector('.sec-body');
    if (!(sectionBody instanceof HTMLElement)) {
      callback();
      return;
    }
    let finished = false;
    const finish = () => {
      if (finished) {
        return;
      }
      finished = true;
      sectionBody.removeEventListener('transitionend', onTransitionEnd);
      clearTimeout(fallbackHandle);
      callback();
    };
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target === sectionBody && event.propertyName === 'grid-template-rows') {
        finish();
      }
    };
    sectionBody.addEventListener('transitionend', onTransitionEnd);
    const fallbackHandle = setTimeout(finish, UiStateService.SECTION_EXPANSION_FALLBACK_MS);
  }

  /** Uruchamia jednorazową animację wyróżnienia tytułu celu nawigacji; restartuje ją przy ponownym kliknięciu. */
  private triggerNavigationHighlight(target: FormSectionNavigationTarget): void {
    if (this.navigationHighlightResetHandle !== null) {
      clearTimeout(this.navigationHighlightResetHandle);
    }
    // zdjęcie i ponowne nałożenie klasy w kolejnej klatce restartuje animację CSS dla tego samego celu
    this._highlightedNavigationTarget.set(null);
    requestAnimationFrame(() => {
      this._highlightedNavigationTarget.set(target);
      this.navigationHighlightResetHandle = setTimeout(
        () => this._highlightedNavigationTarget.set(null),
        UiStateService.NAVIGATION_HIGHLIGHT_DURATION_MS,
      );
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

  setCalculationsManagerScrollTop(scrollTop: number): void {
    this._calculationsManagerScrollTop.set(scrollTop);
  }

  setCalculationsCompareScrollTop(scrollTop: number): void {
    this._calculationsCompareScrollTop.set(scrollTop);
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
