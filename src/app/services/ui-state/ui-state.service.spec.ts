import { FormSectionId, LegendId } from '../../model';
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
  });
});
