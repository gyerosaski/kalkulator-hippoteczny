import { TestBed } from '@angular/core/testing';

import { FormService } from '../services/form/form';
import { CommissionCalcMethod, PrepaymentEffect, PrepaymentFrequency } from '../model';
import { buildMortgageInputs } from './mortgage-inputs.helper';
import { normalizeCalculationData } from './saved-calculation-data.helper';

describe('buildMortgageInputs', () => {
  let formService: FormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    formService = TestBed.inject(FormService);
  });

  it('powinien zmapować dane podstawowe i okresy oprocentowania z wartości formularza', () => {
    const formValue = formService.form.getRawValue();
    const inputs = buildMortgageInputs(formValue);

    expect(inputs.propertyValue).toBe(formValue.basicData.propertyValue);
    expect(inputs.loanAmount).toBe(formValue.basicData.loanAmount);
    expect(inputs.ltv).toBe(formValue.basicData.ltv);
    expect(inputs.loanPeriod).toBe(formValue.basicData.loanPeriod);
    expect(inputs.startDate).toBe(formValue.basicData.startDate);
    expect(inputs.capitalStartDate).toBe(formValue.basicData.capitalStartDate);
    expect(inputs.installmentType).toBe(formValue.basicData.installmentType);
    expect(inputs.ratePeriods).toHaveLength(formValue.ratePeriods.items.length);
    expect(inputs.ratePeriods[0].referenceIndex).toBe(
      formValue.ratePeriods.items[0].referenceIndex,
    );
    expect(inputs.ratePeriods[0].margin).toBe(formValue.ratePeriods.items[0].margin);
  });

  it('powinien zmapować okresy oprocentowania ze starej migawki po normalizacji', () => {
    const formValue = formService.form.getRawValue();
    const legacySnapshot = {
      ...formValue,
      basicData: {
        ...formValue.basicData,
        ratePeriods: formValue.ratePeriods.items,
      },
      ratePeriods: undefined,
    };

    const normalized = normalizeCalculationData(legacySnapshot);
    expect(normalized).not.toBeNull();

    const inputs = buildMortgageInputs(normalized!);
    expect(inputs.ratePeriods).toHaveLength(formValue.ratePeriods.items.length);
    expect(inputs.ratePeriods[0].referenceIndex).toBe(
      formValue.ratePeriods.items[0].referenceIndex,
    );
  });

  it('powinien wyzerować sekcje wyłączone (koszty, transze, nadpłaty)', () => {
    formService.form.controls.overheadCosts.controls.enabled.setValue(false);
    formService.form.controls.tranches.controls.enabled.setValue(false);
    formService.form.controls.prepayments.controls.enabled.setValue(false);

    const inputs = buildMortgageInputs(formService.form.getRawValue());

    expect(inputs.tranches).toEqual([]);
    expect(inputs.prepaymentRules).toEqual([]);
    expect(inputs.targetInstallmentRule?.targetRate).toBe(0);
    expect(inputs.earlyRepaymentCommission?.ratePct).toBe(0);
    expect(inputs.overheadCosts?.commissionValue).toBe(0);
    expect(inputs.overheadCosts?.commissionCalcMethod).toBe(CommissionCalcMethod.PERCENTAGE);
    expect(inputs.overheadCosts?.appraisalFee).toBe(0);
    expect(inputs.overheadCosts?.bridgeInsurance).toEqual({ rateIncrease: 0, months: 0 });
    expect(inputs.overheadCosts?.additionalCosts).toEqual([]);
  });

  it('powinien zmapować włączone koszty okołokredytowe z pól formularza', () => {
    formService.form.controls.overheadCosts.controls.enabled.setValue(true);
    const overheadFields = formService.form.controls.overheadCosts.controls.fields;
    overheadFields.controls.commission.controls.commissionValue.setValue(2.5);
    overheadFields.controls.appraisal.controls.appraisalFee.setValue(800);
    overheadFields.controls.bridge.controls.bridgeRateIncrease.setValue(1.2);
    overheadFields.controls.bridge.controls.bridgeMonths.setValue(6);

    const inputs = buildMortgageInputs(formService.form.getRawValue());

    expect(inputs.overheadCosts?.commissionValue).toBe(2.5);
    expect(inputs.overheadCosts?.appraisalFee).toBe(800);
    expect(inputs.overheadCosts?.bridgeInsurance).toEqual({ rateIncrease: 1.2, months: 6 });
  });

  it('powinien zmapować transze z opłatami za uruchomienie', () => {
    formService.form.controls.tranches.controls.enabled.setValue(true);
    const trancheGroup = formService.tranchesArray.at(0);
    trancheGroup.controls.amount.setValue(150_000);
    trancheGroup.controls.date.setValue('2026-08');
    trancheGroup.controls.disbursementFee.setValue(200);

    const inputs = buildMortgageInputs(formService.form.getRawValue());

    expect(inputs.tranches?.[0]).toEqual({
      amount: 150_000,
      date: '2026-08',
      disbursementFee: 200,
    });
  });

  it('powinien zmapować reguły nadpłat, przyjmując `to = from` dla nadpłaty jednorazowej', () => {
    formService.form.controls.prepayments.controls.enabled.setValue(true);
    const ruleGroup = formService.prepaymentRulesArray.at(0);
    ruleGroup.controls.frequency.setValue(PrepaymentFrequency.ONE_TIME);
    ruleGroup.controls.from.setValue('2027-01');
    ruleGroup.controls.amount.setValue(10_000);
    ruleGroup.controls.effect.setValue(PrepaymentEffect.SHORTEN_PERIOD);

    const inputs = buildMortgageInputs(formService.form.getRawValue());

    expect(inputs.prepaymentRules).toHaveLength(1);
    expect(inputs.prepaymentRules?.[0]).toEqual({
      frequency: PrepaymentFrequency.ONE_TIME,
      from: '2027-01',
      to: '2027-01',
      amount: 10_000,
      effect: PrepaymentEffect.SHORTEN_PERIOD,
    });
  });

  it('powinien pominąć reguły nadpłat bez daty rozpoczęcia', () => {
    formService.form.controls.prepayments.controls.enabled.setValue(true);
    const ruleGroup = formService.prepaymentRulesArray.at(0);
    ruleGroup.controls.frequency.setValue(PrepaymentFrequency.MONTHLY);
    ruleGroup.controls.from.setValue('');
    ruleGroup.controls.amount.setValue(500);

    const inputs = buildMortgageInputs(formService.form.getRawValue());

    expect(inputs.prepaymentRules).toEqual([]);
  });
});
