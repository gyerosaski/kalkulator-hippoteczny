import { FormSectionId, LegendId, SavedCalculationSortOption } from '../../model';
import { UiStateService } from './ui-state.service';

describe('UiStateService', () => {
  let service: UiStateService;

  beforeEach(() => {
    service = new UiStateService();
  });

  describe('sekcje formularza', () => {
    it('powinien zwrócić wartość domyślną przy pierwszym odczycie', () => {
      expect(service.sectionOpen(FormSectionId.BASIC_DATA, true)()).toBe(true);
      expect(service.sectionOpen(FormSectionId.TRANCHES, false)()).toBe(false);
    });

    it('powinien zachować wartość domyślną z pierwszego odczytu', () => {
      expect(service.sectionOpen(FormSectionId.TRANCHES, false)()).toBe(false);
      expect(service.sectionOpen(FormSectionId.TRANCHES, true)()).toBe(false);
    });

    it('powinien przełączać stan rozwinięcia sekcji niezależnie per sekcja', () => {
      service.toggleSection(FormSectionId.BASIC_DATA, true);
      expect(service.sectionOpen(FormSectionId.BASIC_DATA)()).toBe(false);
      expect(service.sectionOpen(FormSectionId.PREPAYMENTS)()).toBe(true);
    });

    it('powinien ustawiać stan rozwinięcia sekcji wprost', () => {
      service.setSectionOpen(FormSectionId.OVERHEAD_COSTS, false);
      expect(service.sectionOpen(FormSectionId.OVERHEAD_COSTS)()).toBe(false);
      service.setSectionOpen(FormSectionId.OVERHEAD_COSTS, true);
      expect(service.sectionOpen(FormSectionId.OVERHEAD_COSTS)()).toBe(true);
    });
  });

  describe('podsekcje', () => {
    it('powinien trzymać jedną otwartą podsekcję per sekcja', () => {
      service.setOpenSubsection(FormSectionId.OVERHEAD_COSTS, 'commission');
      expect(service.openSubsection(FormSectionId.OVERHEAD_COSTS)()).toBe('commission');

      service.setOpenSubsection(FormSectionId.OVERHEAD_COSTS, 'appraisal');
      expect(service.openSubsection(FormSectionId.OVERHEAD_COSTS)()).toBe('appraisal');

      expect(service.openSubsection(FormSectionId.PREPAYMENTS)()).toBeNull();
    });

    it('powinien zamykać podsekcję wartością null', () => {
      service.setOpenSubsection(FormSectionId.PREPAYMENTS, 'prowizjaWczesniejszaSplata');
      service.setOpenSubsection(FormSectionId.PREPAYMENTS, null);
      expect(service.openSubsection(FormSectionId.PREPAYMENTS)()).toBeNull();
    });
  });

  describe('legendy', () => {
    it('powinien przełączać rozwinięcie pozycji legendy niezależnie per legenda', () => {
      service.toggleLegendLabel(LegendId.DONUT_TOTAL, 'Koszty okołokredytowe');
      expect(service.expandedLegendLabel(LegendId.DONUT_TOTAL)()).toBe('Koszty okołokredytowe');
      expect(service.expandedLegendLabel(LegendId.DONUT_INSTALLMENT)()).toBeNull();

      service.toggleLegendLabel(LegendId.DONUT_TOTAL, 'Koszty okołokredytowe');
      expect(service.expandedLegendLabel(LegendId.DONUT_TOTAL)()).toBeNull();
    });
  });

  describe('harmonogram i wykres trendu', () => {
    it('powinien przełączać rozwinięty rok harmonogramu', () => {
      service.toggleScheduleYear(2026);
      expect(service.expandedScheduleYear()).toBe(2026);
      service.toggleScheduleYear(2027);
      expect(service.expandedScheduleYear()).toBe(2027);
      service.toggleScheduleYear(2027);
      expect(service.expandedScheduleYear()).toBeNull();
    });

    it('powinien przełączać wybrany rok wykresu trendu', () => {
      service.toggleTrendYear(3);
      expect(service.selectedTrendYearIndex()).toBe(3);
      service.toggleTrendYear(3);
      expect(service.selectedTrendYearIndex()).toBeNull();
    });
  });

  describe('zaznaczony miesiąc', () => {
    it('powinien przełączać i czyścić zaznaczenie miesiąca', () => {
      service.toggleSelectedMonth(14);
      expect(service.selectedMonthIndex()).toBe(14);
      service.toggleSelectedMonth(14);
      expect(service.selectedMonthIndex()).toBeNull();

      service.toggleSelectedMonth(7);
      service.clearSelectedMonth();
      expect(service.selectedMonthIndex()).toBeNull();
    });

    it('powinien zachować zaznaczenie mieszczące się w nowym harmonogramie (przełączanie zakładek)', () => {
      service.toggleSelectedMonth(120);
      service.clampSelectedMonth(360);
      expect(service.selectedMonthIndex()).toBe(120);
    });

    it('powinien wyczyścić zaznaczenie wykraczające poza nowy harmonogram', () => {
      service.toggleSelectedMonth(300);
      service.clampSelectedMonth(180);
      expect(service.selectedMonthIndex()).toBeNull();
    });

    it('powinien pozostawić brak zaznaczenia bez zmian', () => {
      service.clampSelectedMonth(180);
      expect(service.selectedMonthIndex()).toBeNull();
    });
  });

  describe('pozycja scrolla kolumn kalkulatora', () => {
    it('powinien domyślnie zwracać zerową pozycję scrolla dla obu kolumn', () => {
      expect(service.calculatorFormColumnScrollTop()).toBe(0);
      expect(service.calculatorResultsColumnScrollTop()).toBe(0);
    });

    it('powinien zapamiętywać pozycję scrolla każdej kolumny niezależnie', () => {
      service.setCalculatorFormColumnScrollTop(120);
      service.setCalculatorResultsColumnScrollTop(340);

      expect(service.calculatorFormColumnScrollTop()).toBe(120);
      expect(service.calculatorResultsColumnScrollTop()).toBe(340);
    });
  });

  describe('pozycja scrolla pozostałych widoków', () => {
    it('powinien domyślnie zwracać zerową pozycję scrolla obu widoków', () => {
      expect(service.calculationsManagerScrollTop()).toBe(0);
      expect(service.calculationsCompareScrollTop()).toBe(0);
    });

    it('powinien zapamiętywać pozycję scrolla każdego widoku niezależnie', () => {
      service.setCalculationsManagerScrollTop(180);
      service.setCalculationsCompareScrollTop(420);

      expect(service.calculationsManagerScrollTop()).toBe(180);
      expect(service.calculationsCompareScrollTop()).toBe(420);
    });
  });

  describe('reset stanu kalkulacji', () => {
    it('powinien wyczyścić zaznaczenia w wynikach do null', () => {
      service.toggleSelectedMonth(42);
      service.toggleScheduleYear(2030);
      service.toggleTrendYear(5);

      service.resetCalculationViewState();

      expect(service.selectedMonthIndex()).toBeNull();
      expect(service.expandedScheduleYear()).toBeNull();
      expect(service.selectedTrendYearIndex()).toBeNull();
    });

    it('powinien wyzerować pozycję scrolla obu kolumn', () => {
      service.setCalculatorFormColumnScrollTop(200);
      service.setCalculatorResultsColumnScrollTop(450);

      service.resetCalculationViewState();

      expect(service.calculatorFormColumnScrollTop()).toBe(0);
      expect(service.calculatorResultsColumnScrollTop()).toBe(0);
    });

    it('powinien zamknąć otwarte podsekcje i rozwinięte pozycje legendy', () => {
      service.setOpenSubsection(FormSectionId.OVERHEAD_COSTS, 'commission');
      service.toggleLegendLabel(LegendId.DONUT_TOTAL, 'Koszty okołokredytowe');

      service.resetCalculationViewState();

      expect(service.openSubsection(FormSectionId.OVERHEAD_COSTS)()).toBeNull();
      expect(service.expandedLegendLabel(LegendId.DONUT_TOTAL)()).toBeNull();
    });

    it('powinien przywrócić sekcje do ich pierwotnego stanu domyślnego', () => {
      // utrwalenie defaultów przez pierwszy odczyt (jak przy renderze sekcji)
      service.sectionOpen(FormSectionId.BASIC_DATA, true);
      service.sectionOpen(FormSectionId.TRANCHES, false);

      service.setSectionOpen(FormSectionId.BASIC_DATA, false);
      service.setSectionOpen(FormSectionId.TRANCHES, true);

      service.resetCalculationViewState();

      expect(service.sectionOpen(FormSectionId.BASIC_DATA)()).toBe(true);
      expect(service.sectionOpen(FormSectionId.TRANCHES)()).toBe(false);
    });

    it('nie powinien zmieniać pozycji scrolla listy kalkulacji i porównania', () => {
      service.setCalculationsManagerScrollTop(180);
      service.setCalculationsCompareScrollTop(420);

      service.resetCalculationViewState();

      expect(service.calculationsManagerScrollTop()).toBe(180);
      expect(service.calculationsCompareScrollTop()).toBe(420);
    });

    it('nie powinien zmieniać preferencji sortowania listy kalkulacji', () => {
      service.setSavedCalculationsSortOption(SavedCalculationSortOption.NAME);
      const directionBeforeReset = service.savedCalculationsSortDirection();

      service.resetCalculationViewState();

      expect(service.savedCalculationsSortOption()).toBe(SavedCalculationSortOption.NAME);
      expect(service.savedCalculationsSortDirection()).toBe(directionBeforeReset);
    });
  });
});
