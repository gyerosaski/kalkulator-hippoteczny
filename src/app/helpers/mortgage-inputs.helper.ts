import {
  CommissionCalcMethod,
  InsuranceCalcMethod,
  InsuranceFrequency,
  LifeInsuranceCalcMethod,
  MortgageFormRawValue,
  MortgageInputs,
  OverheadCostsInputs,
  PrepaymentEffect,
  PrepaymentFrequency,
  RatePeriod,
  Tranche,
} from '../model';
import { nextMonthStr } from './date.helper';

/**
 * Buduje wejścia silnika kalkulacyjnego z migawki wartości formularza (`form.getRawValue()`).
 * Używane zarówno dla bieżącej kalkulacji, jak i dla zapisanych rekordów (`SavedCalculationRecord.data`),
 * dlatego odczyty są defensywne — starsze migawki mogą nie zawierać wszystkich pól.
 */
export function buildMortgageInputs(formValue: MortgageFormRawValue): MortgageInputs {
  const prepaymentsEnabled = formValue.prepayments.enabled;
  const tranchesEnabled = formValue.tranches.enabled;
  const overheadEnabled = formValue.overheadCosts.enabled;

  const prepaymentRules = prepaymentsEnabled
    ? (formValue.prepayments.fields.prepaymentRules.items ?? [])
        .filter(
          (rule) =>
            rule && rule.from && (rule.frequency === PrepaymentFrequency.ONE_TIME || rule.to),
        )
        .map((rule) => ({
          frequency: rule.frequency,
          from: rule.from,
          to: rule.frequency === PrepaymentFrequency.ONE_TIME ? rule.from : rule.to || rule.from,
          amount: Number(rule.amount) || 0,
          effect: rule.effect,
        }))
    : [];

  const targetInstallment = prepaymentsEnabled
    ? formValue.prepayments.fields.rataDocelowaRegula
    : undefined;
  const earlyRepaymentCommission = prepaymentsEnabled
    ? formValue.prepayments.fields.prowizjaWczesniejszaSplata
    : undefined;

  const tranches: Tranche[] = tranchesEnabled
    ? (formValue.tranches.fields.tranches ?? []).map((tranche) => ({
        amount: Number(tranche.amount) || 0,
        date: tranche.date || '',
        disbursementFee: Number(tranche.disbursementFee) || 0,
      }))
    : [];

  const overheadCostsRaw = overheadEnabled ? formValue.overheadCosts.fields : undefined;

  const overheadCosts: OverheadCostsInputs = overheadCostsRaw
    ? {
        commissionValue: Number(overheadCostsRaw.commission?.commissionValue) || 0,
        commissionCalcMethod:
          overheadCostsRaw.commission?.commissionCalcMethod ?? CommissionCalcMethod.PERCENTAGE,
        appraisalFee: Number(overheadCostsRaw.appraisal?.appraisalFee) || 0,
        bridgeInsurance: {
          rateIncrease: Number(overheadCostsRaw.bridge?.bridgeRateIncrease) || 0,
          months: Number(overheadCostsRaw.bridge?.bridgeMonths) || 0,
        },
        propertyInsurance: {
          frequency: overheadCostsRaw.propertyInsurance?.propInsFrequency,
          calcMethod: overheadCostsRaw.propertyInsurance?.propInsCalcMethod,
          value: Number(overheadCostsRaw.propertyInsurance?.propInsValue) || 0,
          from: overheadCostsRaw.propertyInsurance?.propInsFrom,
          to: overheadCostsRaw.propertyInsurance?.propInsTo,
        },
        lowEquityInsurance: {
          rateIncrease: Number(overheadCostsRaw.lowEquityInsurance?.lowEquityRateIncrease) || 0,
        },
        lifeInsurance: {
          frequency: overheadCostsRaw.lifeInsurance?.lifeInsFrequency,
          calcMethod: overheadCostsRaw.lifeInsurance?.lifeInsCalcMethod,
          value: Number(overheadCostsRaw.lifeInsurance?.lifeInsValue) || 0,
          from: overheadCostsRaw.lifeInsurance?.lifeInsFrom,
          to: overheadCostsRaw.lifeInsurance?.lifeInsTo,
        },
        jobLossInsurance: {
          frequency: overheadCostsRaw.jobLossInsurance?.jobLossInsFrequency,
          calcMethod: overheadCostsRaw.jobLossInsurance?.jobLossInsCalcMethod,
          value: Number(overheadCostsRaw.jobLossInsurance?.jobLossInsValue) || 0,
          from: overheadCostsRaw.jobLossInsurance?.jobLossInsFrom,
          to: overheadCostsRaw.jobLossInsurance?.jobLossInsTo,
        },
        additionalCosts: (overheadCostsRaw.additionalCosts?.items ?? []).map((additionalCost) => ({
          name: additionalCost.name || '',
          frequency: additionalCost.frequency,
          calcMethod: additionalCost.calcMethod,
          value: Number(additionalCost.value) || 0,
          from: additionalCost.from,
          to: additionalCost.to,
        })),
        promotionalRate: {
          rateDecrease: Number(overheadCostsRaw.promoRate?.promoRateDecrease) || 0,
          from: overheadCostsRaw.promoRate?.promoFrom,
          to: overheadCostsRaw.promoRate?.promoTo,
        },
      }
    : {
        commissionValue: 0,
        commissionCalcMethod: CommissionCalcMethod.PERCENTAGE,
        appraisalFee: 0,
        bridgeInsurance: { rateIncrease: 0, months: 0 },
        propertyInsurance: {
          frequency: InsuranceFrequency.YEARLY,
          calcMethod: InsuranceCalcMethod.PCT_PROPERTY_VALUE,
          value: 0,
          from: nextMonthStr(),
          to: nextMonthStr(),
        },
        lowEquityInsurance: { rateIncrease: 0 },
        lifeInsurance: {
          frequency: InsuranceFrequency.YEARLY,
          calcMethod: LifeInsuranceCalcMethod.PCT_LOAN_AMOUNT,
          value: 0,
          from: nextMonthStr(),
          to: nextMonthStr(),
        },
        jobLossInsurance: {
          frequency: InsuranceFrequency.ONE_TIME,
          calcMethod: LifeInsuranceCalcMethod.PCT_LOAN_AMOUNT,
          value: 0,
          from: nextMonthStr(),
          to: nextMonthStr(),
        },
        additionalCosts: [],
        promotionalRate: {
          rateDecrease: 0,
          from: nextMonthStr(),
          to: nextMonthStr(),
        },
      };

  const basicData = formValue.basicData;
  const ratePeriods: RatePeriod[] = (formValue.ratePeriods?.items ?? []).map((ratePeriod) => ({
    from: ratePeriod.from || basicData.startDate,
    rateType: ratePeriod.rateType,
    nominalRate: Number(ratePeriod.nominalRate) || 0,
    wibor: Number(ratePeriod.wibor) || 0,
    margin: Number(ratePeriod.margin) || 0,
  }));

  return {
    propertyValue: basicData.propertyValue,
    loanAmount: basicData.loanAmount,
    ltv: basicData.ltv,
    loanPeriod: basicData.loanPeriod,
    startDate: basicData.startDate,
    capitalStartDate: basicData.capitalStartDate,
    installmentType: basicData.installmentType,
    ratePeriods,
    prepaymentRules,
    tranches,
    targetInstallmentRule: targetInstallment
      ? {
          targetRate: Number(targetInstallment.targetRate) || 0,
          from: targetInstallment.from || nextMonthStr(),
          to: targetInstallment.to || nextMonthStr(),
          effect: targetInstallment.effect || PrepaymentEffect.LOWER_INSTALLMENT,
        }
      : {
          targetRate: 0,
          from: nextMonthStr(),
          to: nextMonthStr(),
          effect: PrepaymentEffect.LOWER_INSTALLMENT,
        },
    earlyRepaymentCommission: earlyRepaymentCommission
      ? {
          ratePct: Number(earlyRepaymentCommission.ratePct) || 0,
          validUntil: earlyRepaymentCommission.validUntil || nextMonthStr(),
        }
      : {
          ratePct: 0,
          validUntil: nextMonthStr(),
        },
    overheadCosts,
  };
}
