import { TestBed } from '@angular/core/testing';

import { FormService } from './form';
import { PrepaymentEffect, PrepaymentFrequency, RateType } from '../../model';

describe('FormService', () => {
  let service: FormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadFromFile — okresy oprocentowania', () => {
    it('wczytuje okresy oprocentowania z bieżącego kształtu (`ratePeriods.items`)', () => {
      const data = service.form.getRawValue();
      data.ratePeriods.items = [
        {
          from: '2026-06',
          rateType: RateType.FIXED,
          nominalRate: 7.5,
          referenceIndex: 0,
          margin: 0,
        },
        {
          from: '2028-06',
          rateType: RateType.VARIABLE,
          nominalRate: 0,
          referenceIndex: 5.5,
          margin: 2,
        },
      ];

      service.loadFromFile(data);

      expect(service.ratePeriodsArray.length).toBe(2);
      expect(service.ratePeriodsArray.at(0).getRawValue().nominalRate).toBe(7.5);
      expect(service.ratePeriodsArray.at(1).getRawValue().referenceIndex).toBe(5.5);
    });

    it('wczytuje okresy oprocentowania ze starego kształtu (`basicData.ratePeriods`)', () => {
      const current = service.form.getRawValue();
      const legacySnapshot = {
        ...current,
        ratePeriods: undefined,
        basicData: {
          ...current.basicData,
          ratePeriods: [
            {
              from: '2026-06',
              rateType: RateType.FIXED,
              nominalRate: 6.8,
              referenceIndex: 0,
              margin: 0,
            },
          ],
        },
      };

      service.loadFromFile(legacySnapshot);

      expect(service.ratePeriodsArray.length).toBe(1);
      expect(service.ratePeriodsArray.at(0).getRawValue().rateType).toBe(RateType.FIXED);
      expect(service.ratePeriodsArray.at(0).getRawValue().nominalRate).toBe(6.8);
    });
  });

  describe('loadFromFile — reguły nadpłat', () => {
    it('wczytuje wszystkie reguły nadpłat z kształtu `prepaymentRules.items`', () => {
      const data = service.form.getRawValue();
      data.prepayments.enabled = true;
      data.prepayments.fields.prepaymentRules.items = [
        {
          frequency: PrepaymentFrequency.ONE_TIME,
          from: '2027-01',
          to: '2027-01',
          amount: 10_000,
          effect: PrepaymentEffect.SHORTEN_PERIOD,
        },
        {
          frequency: PrepaymentFrequency.MONTHLY,
          from: '2028-01',
          to: '2029-01',
          amount: 500,
          effect: PrepaymentEffect.LOWER_INSTALLMENT,
        },
      ];

      service.loadFromFile(data);

      expect(service.prepaymentRulesArray.length).toBe(2);
      expect(service.prepaymentRulesArray.at(0).getRawValue().amount).toBe(10_000);
      expect(service.prepaymentRulesArray.at(1).getRawValue()).toEqual({
        frequency: PrepaymentFrequency.MONTHLY,
        from: '2028-01',
        to: '2029-01',
        amount: 500,
        effect: PrepaymentEffect.LOWER_INSTALLMENT,
      });
    });

    it('wczytuje reguły nadpłat z historycznego kształtu z płaską tablicą', () => {
      const data = service.form.getRawValue() as Record<string, unknown> & {
        prepayments: { fields: { prepaymentRules: unknown } };
      };
      data.prepayments.fields.prepaymentRules = [
        {
          frequency: PrepaymentFrequency.YEARLY,
          from: '2027-01',
          to: '2030-01',
          amount: 7_500,
          effect: PrepaymentEffect.SHORTEN_PERIOD,
        },
      ];

      service.loadFromFile(data);

      expect(service.prepaymentRulesArray.length).toBe(1);
      expect(service.prepaymentRulesArray.at(0).getRawValue().amount).toBe(7_500);
      expect(service.prepaymentRulesArray.at(0).getRawValue().frequency).toBe(
        PrepaymentFrequency.YEARLY,
      );
    });
  });

  describe('crossFieldValidator — capitalBeforeLastTranche', () => {
    function enableTranches(): void {
      service.form.controls.tranches.controls.enabled.setValue(true);
      // Pierwsza transza (index 0) powstaje z datą domyślną równą bieżącemu miesiącowi.
      // Przypinamy ją do stałej, wczesnej daty, aby wynik walidatora nie zależał od
      // dzisiejszej daty — testy operują wyłącznie na jawnie ustawianych datach transz.
      service.tranchesArray.at(0).controls.date.setValue('2026-01');
      service.form.updateValueAndValidity();
    }

    function setCapitalStartDate(dateYm: string): void {
      service.form.controls.basicData.controls.capitalStartDate.setValue(dateYm);
      service.form.updateValueAndValidity();
    }

    function addTrancheWithDate(dateYm: string): void {
      service.addTranche();
      const lastIndex = service.tranchesArray.length - 1;
      service.tranchesArray.at(lastIndex).controls.date.setValue(dateYm);
      service.form.updateValueAndValidity();
    }

    it('should not emit capitalBeforeLastTranche when tranches are disabled', () => {
      service.form.controls.tranches.controls.enabled.setValue(false);
      addTrancheWithDate('2026-06');
      setCapitalStartDate('2026-05');

      expect(service.form.errors?.['capitalBeforeLastTranche']).toBeUndefined();
    });

    it('should not emit capitalBeforeLastTranche when there is only one tranche (no extra tranches added)', () => {
      enableTranches();
      // Only first tranche exists — tranchesArray.length === 1
      setCapitalStartDate('2026-01');

      expect(service.form.errors?.['capitalBeforeLastTranche']).toBeUndefined();
    });

    it('should emit capitalBeforeLastTranche when capitalStartDate equals the last tranche date', () => {
      enableTranches();
      addTrancheWithDate('2026-06');
      setCapitalStartDate('2026-06');

      const error = service.form.errors?.['capitalBeforeLastTranche'];
      expect(error).toBeTruthy();
      expect(error['lastTrancheDate']).toBe('2026-06');
    });

    it('should emit capitalBeforeLastTranche when capitalStartDate is before the last tranche date', () => {
      enableTranches();
      addTrancheWithDate('2026-08');
      setCapitalStartDate('2026-07');

      const error = service.form.errors?.['capitalBeforeLastTranche'];
      expect(error).toBeTruthy();
      expect(error['lastTrancheDate']).toBe('2026-08');
    });

    it('should not emit capitalBeforeLastTranche when capitalStartDate is strictly after the last tranche date', () => {
      enableTranches();
      addTrancheWithDate('2026-06');
      setCapitalStartDate('2026-07');

      expect(service.form.errors?.['capitalBeforeLastTranche']).toBeUndefined();
    });

    it('should use the maximum date across all extra tranches as lastTrancheDate', () => {
      enableTranches();
      addTrancheWithDate('2026-04');
      addTrancheWithDate('2026-09');
      addTrancheWithDate('2026-06');
      setCapitalStartDate('2026-08');

      const error = service.form.errors?.['capitalBeforeLastTranche'];
      expect(error).toBeTruthy();
      expect(error['lastTrancheDate']).toBe('2026-09');
    });

    it('should not emit capitalBeforeLastTranche when capitalStartDate is after the maximum tranche date', () => {
      enableTranches();
      addTrancheWithDate('2026-04');
      addTrancheWithDate('2026-09');
      addTrancheWithDate('2026-06');
      setCapitalStartDate('2026-10');

      expect(service.form.errors?.['capitalBeforeLastTranche']).toBeUndefined();
    });

    it('should clear capitalBeforeLastTranche error after tranche is removed leaving only first tranche', () => {
      enableTranches();
      addTrancheWithDate('2026-06');
      setCapitalStartDate('2026-06');

      expect(service.form.errors?.['capitalBeforeLastTranche']).toBeTruthy();

      service.removeTranche(1);

      expect(service.form.errors?.['capitalBeforeLastTranche']).toBeUndefined();
    });

    it('should clear capitalBeforeLastTranche error after tranches are disabled', () => {
      enableTranches();
      addTrancheWithDate('2026-06');
      setCapitalStartDate('2026-06');

      expect(service.form.errors?.['capitalBeforeLastTranche']).toBeTruthy();

      service.form.controls.tranches.controls.enabled.setValue(false);
      service.form.updateValueAndValidity();

      expect(service.form.errors?.['capitalBeforeLastTranche']).toBeUndefined();
    });
  });

  describe('walidacja pola "Kwota" transzy — sekcja "Transze" wyłączona', () => {
    function enableTranches(): void {
      service.form.controls.tranches.controls.enabled.setValue(true);
      service.form.updateValueAndValidity();
    }

    it('should make the form invalid when a second tranche has amount 0 and the section is enabled', () => {
      enableTranches();
      service.addTranche();

      expect(service.form.invalid).toBe(true);
    });

    it('should make the form valid when the section is disabled after adding a second tranche with amount 0', () => {
      enableTranches();
      service.addTranche();
      expect(service.form.invalid).toBe(true);

      service.form.controls.tranches.controls.enabled.setValue(false);
      service.form.updateValueAndValidity();

      expect(service.form.valid).toBe(true);
      expect(service.tranchesArray.at(1).controls.amount.disabled).toBe(true);
    });

    it('should keep tranche amount controls disabled when a tranche is added while the section is already disabled', () => {
      service.form.controls.tranches.controls.enabled.setValue(false);
      service.addTranche();

      expect(service.tranchesArray.at(1).controls.amount.disabled).toBe(true);
      expect(service.form.valid).toBe(true);
    });

    it('should make the form invalid again when the section is re-enabled with amount still 0', () => {
      service.form.controls.tranches.controls.enabled.setValue(false);
      service.addTranche();

      service.form.controls.tranches.controls.enabled.setValue(true);
      service.form.updateValueAndValidity();

      expect(service.tranchesArray.at(1).controls.amount.disabled).toBe(false);
      expect(service.form.invalid).toBe(true);
    });
  });
});
