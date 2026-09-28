import { TestBed } from '@angular/core/testing';

import { FormService } from './form';
import {
  CapitalAfterLoanEndErrorDetails,
  CapitalBeforeLastTrancheErrorDetails,
  InsuranceFrequency,
  ItemPositionsErrorDetails,
  OverheadCostDatesErrorDetails,
  OverheadCostKind,
  PrepaymentEffect,
  PrepaymentFrequency,
  RateType,
} from '../../model';

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

      const error = service.form.errors?.['capitalBeforeLastTranche'] as
        | CapitalBeforeLastTrancheErrorDetails
        | undefined;
      expect(error).toBeTruthy();
      expect(error?.lastTrancheDate).toBe('2026-06');
    });

    it('should emit capitalBeforeLastTranche when capitalStartDate is before the last tranche date', () => {
      enableTranches();
      addTrancheWithDate('2026-08');
      setCapitalStartDate('2026-07');

      const error = service.form.errors?.['capitalBeforeLastTranche'] as
        | CapitalBeforeLastTrancheErrorDetails
        | undefined;
      expect(error).toBeTruthy();
      expect(error?.lastTrancheDate).toBe('2026-08');
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

      const error = service.form.errors?.['capitalBeforeLastTranche'] as
        | CapitalBeforeLastTrancheErrorDetails
        | undefined;
      expect(error).toBeTruthy();
      expect(error?.lastTrancheDate).toBe('2026-09');
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

/**
 * Walidacje dat względem okresu spłaty: daty muszą mieścić się między miesiącem pierwszej raty
 * a miesiącem ostatniej raty.
 * Kredyt w testach: uruchomienie 2026-01, 24 miesiące → pierwsza rata 2026-02, ostatnia 2028-01.
 */
describe('FormService — walidacje dat względem okresu spłaty', () => {
  let service: FormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormService);
    const basicData = service.form.controls.basicData.controls;
    basicData.startDate.setValue('2026-01');
    basicData.capitalStartDate.setValue('2026-06');
    basicData.loanPeriod.setValue(24);
    service.form.updateValueAndValidity();
  });

  function formError<T>(key: string): T | undefined {
    return service.form.errors?.[key] as T | undefined;
  }

  function setCapitalStartDate(dateYm: string): void {
    service.form.controls.basicData.controls.capitalStartDate.setValue(dateYm);
    service.form.updateValueAndValidity();
  }

  function setUpTwoTranches(secondTrancheDate: string): void {
    service.form.controls.tranches.controls.enabled.setValue(true);
    service.addTranche();
    const loanAmount = service.form.controls.basicData.controls.loanAmount.value;
    service.tranchesArray.at(0).controls.amount.setValue(loanAmount - 100_000);
    service.tranchesArray.at(1).controls.amount.setValue(100_000);
    service.tranchesArray.at(1).controls.date.setValue(secondTrancheDate);
    service.form.updateValueAndValidity();
  }

  function setRatePeriodDates(...laterPeriodDates: string[]): void {
    for (const date of laterPeriodDates) {
      service.addRatePeriod();
      service.ratePeriodsArray.at(service.ratePeriodsArray.length - 1).controls.from.setValue(date);
    }
    service.form.updateValueAndValidity();
  }

  function enableOverheadCosts(): void {
    service.form.controls.overheadCosts.controls.enabled.setValue(true);
    service.form.updateValueAndValidity();
  }

  describe('Dane podstawowe', () => {
    it('początek spłat kapitału w okresie kredytowania jest poprawny', () => {
      setCapitalStartDate('2026-06');

      expect(service.form.valid).toBe(true);
    });

    it('początek spłat kapitału w miesiącu ostatniej raty jest poprawny (jedna rata kapitałowa)', () => {
      setCapitalStartDate('2028-01');

      expect(formError('capitalAfterLoanEnd')).toBeUndefined();
    });

    it('odrzuca początek spłat kapitału po ostatniej racie (karencja ≥ okres)', () => {
      setCapitalStartDate('2028-03');

      expect(service.form.valid).toBe(false);
      expect(formError<CapitalAfterLoanEndErrorDetails>('capitalAfterLoanEnd')).toEqual({
        loanEndDate: '2028-01',
      });
    });

    it('pierwszy okres oprocentowania podąża za datą uruchomienia kredytu', () => {
      service.form.controls.basicData.controls.startDate.setValue('2027-03');

      expect(service.ratePeriodsArray.at(0).controls.from.value).toBe('2027-03');
    });
  });

  describe('Oprocentowanie', () => {
    it('okresy z różnymi datami „od” w okresie spłaty są poprawne', () => {
      setRatePeriodDates('2026-07', '2027-01');

      expect(service.form.valid).toBe(true);
    });

    it('odrzuca okres zaczynający się w miesiącu uruchomienia (duplikat pierwszego okresu)', () => {
      setRatePeriodDates('2026-01');

      expect(service.form.valid).toBe(false);
      expect(formError<ItemPositionsErrorDetails>('ratePeriodOutsideLoan')).toEqual({
        positions: [2],
      });
    });

    it('odrzuca okres zaczynający się po ostatniej racie', () => {
      setRatePeriodDates('2026-07', '2028-05');

      expect(formError<ItemPositionsErrorDetails>('ratePeriodOutsideLoan')).toEqual({
        positions: [3],
      });
    });

    it('odrzuca dwa okresy z tą samą datą „od” (drugi nadpisywałby pierwszy)', () => {
      setRatePeriodDates('2026-07', '2026-07');

      expect(service.form.valid).toBe(false);
      expect(formError<ItemPositionsErrorDetails>('ratePeriodDuplicateDates')).toEqual({
        positions: [2, 3],
      });
    });
  });

  describe('Transze', () => {
    it('druga transza uruchomiona po dacie uruchomienia kredytu jest poprawna', () => {
      setUpTwoTranches('2026-03');

      expect(service.form.valid).toBe(true);
    });

    it('odrzuca drugą transzę z datą uruchomienia kredytu (harmonogram by ją pominął)', () => {
      setUpTwoTranches('2026-01');

      expect(service.form.valid).toBe(false);
      expect(formError<ItemPositionsErrorDetails>('trancheDateNotAfterStart')).toEqual({
        positions: [2],
      });
    });

    it('nie waliduje dat transz, gdy sekcja jest wyłączona', () => {
      setUpTwoTranches('2026-01');
      service.form.controls.tranches.controls.enabled.setValue(false);
      service.form.updateValueAndValidity();

      expect(formError('trancheDateNotAfterStart')).toBeUndefined();
    });
  });

  describe('Nadpłaty', () => {
    function setUpPrepaymentRule(from: string, amount: number): void {
      service.form.controls.prepayments.controls.enabled.setValue(true);
      const rule = service.prepaymentRulesArray.at(0).controls;
      rule.frequency.setValue(PrepaymentFrequency.ONE_TIME);
      rule.from.setValue(from);
      rule.to.setValue(from);
      rule.amount.setValue(amount);
      service.form.updateValueAndValidity();
    }

    it('odrzuca nadpłatę w miesiącu uruchomienia (przed pierwszą ratą)', () => {
      setUpPrepaymentRule('2026-01', 10_000);

      expect(formError<ItemPositionsErrorDetails>('prepaymentOutsideLoan')).toEqual({
        positions: [1],
      });
    });

    it('odrzuca nadpłatę po ostatniej racie', () => {
      setUpPrepaymentRule('2028-02', 10_000);

      expect(formError('prepaymentOutsideLoan')).toBeDefined();
    });

    it('nie waliduje daty nieaktywnej reguły (kwota 0)', () => {
      setUpPrepaymentRule('2030-01', 0);

      expect(formError('prepaymentOutsideLoan')).toBeUndefined();
    });

    it('odrzuca aktywną regułę docelowej raty zaczynającą się po ostatniej racie', () => {
      service.form.controls.prepayments.controls.enabled.setValue(true);
      const targetInstallment = service.prepaymentsGroup.controls.targetInstallment.controls;
      targetInstallment.targetRate.setValue(5000);
      targetInstallment.from.setValue('2028-06');
      targetInstallment.to.setValue('2028-12');
      service.form.updateValueAndValidity();

      expect(formError('targetInstallmentOutsideLoan')).toBe(true);
    });
  });

  describe('Koszty okołokredytowe i promocje', () => {
    it('odrzuca aktywne ubezpieczenie zaczynające się przed pierwszą ratą', () => {
      enableOverheadCosts();
      const lifeInsurance = service.overheadCostsGroup.controls.lifeInsurance.controls;
      lifeInsurance.lifeInsValue.setValue(0.5);
      lifeInsurance.lifeInsFrequency.setValue(InsuranceFrequency.YEARLY);
      lifeInsurance.lifeInsFrom.setValue('2026-01');
      lifeInsurance.lifeInsTo.setValue('2028-01');
      service.form.updateValueAndValidity();

      expect(formError<OverheadCostDatesErrorDetails>('overheadCostOutsideLoan')).toEqual({
        kinds: [OverheadCostKind.LIFE_INSURANCE],
      });
    });

    it('nie waliduje dat nieaktywnych kosztów (wartość 0)', () => {
      enableOverheadCosts();
      const lifeInsurance = service.overheadCostsGroup.controls.lifeInsurance.controls;
      lifeInsurance.lifeInsFrom.setValue('2030-01');
      service.form.updateValueAndValidity();

      expect(formError('overheadCostOutsideLoan')).toBeUndefined();
    });

    it('odrzuca koszt cykliczny z datą „do” wcześniejszą niż „od”', () => {
      enableOverheadCosts();
      const additionalCost = service.additionalCostsArray.at(0).controls;
      additionalCost.value.setValue(100);
      additionalCost.frequency.setValue(InsuranceFrequency.MONTHLY);
      additionalCost.from.setValue('2027-01');
      additionalCost.to.setValue('2026-06');
      service.form.updateValueAndValidity();

      expect(formError<OverheadCostDatesErrorDetails>('overheadCostDateRangeInvalid')).toEqual({
        kinds: [OverheadCostKind.ADDITIONAL_COST],
      });
    });

    it('ignoruje ukryte pole „do” kosztu jednorazowego', () => {
      enableOverheadCosts();
      const additionalCost = service.additionalCostsArray.at(0).controls;
      additionalCost.value.setValue(100);
      additionalCost.frequency.setValue(InsuranceFrequency.ONE_TIME);
      additionalCost.from.setValue('2027-01');
      additionalCost.to.setValue('2026-06');
      service.form.updateValueAndValidity();

      expect(formError('overheadCostDateRangeInvalid')).toBeUndefined();
    });

    it('odrzuca aktywną promocję poza okresem spłaty oraz z odwróconym zakresem dat', () => {
      enableOverheadCosts();
      const promotionalRate = service.overheadCostsGroup.controls.promoRate.controls;
      promotionalRate.promoRateDecrease.setValue(1);
      promotionalRate.promoFrom.setValue('2028-06');
      promotionalRate.promoTo.setValue('2028-03');
      service.form.updateValueAndValidity();

      expect(formError('promotionalRateOutsideLoan')).toBe(true);
      expect(formError('promotionalRateDateRangeInvalid')).toBe(true);
    });
  });
});
