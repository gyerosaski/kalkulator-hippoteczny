import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import {
  CommissionCalcMethod,
  InsuranceCalcMethod,
  InsuranceFrequency,
  LifeInsuranceCalcMethod,
  MortgageInputs,
  MortgageResults,
  OverheadCostsInputs,
  PrepaymentEffect,
  PrepaymentFrequency,
  RatePeriod,
  ScheduleRow,
  Tranche,
  YearGroup,
} from '../../model';
import { CalculatorService } from '../../services/calculator/calculator.service';
import { CalculatorStateService } from '../../services/calculator-state/calculator-state.service';
import { FormService } from '../../services/form/form';
import { SelectedMonthService } from '../../services/selected-month/selected-month.service';
import { BasicDataFormComponent } from '../../components/form/basic-data-form/basic-data-form.component';
import { OverheadCostsFormComponent } from '../../components/form/overhead-costs-form/overhead-costs-form.component';
import { TranchesFormComponent } from '../../components/form/tranches-form/tranches-form.component';
import { PrepaymentsFormComponent } from '../../components/form/prepayments-form/prepayments-form.component';
import { ResultsSummaryComponent } from '../../components/results/results-summary/results-summary.component';
import { ResultsChartsComponent } from '../../components/results/results-charts/results-charts.component';
import { ResultsTrendChartComponent } from '../../components/results/results-trend-chart/results-trend-chart.component';
import { ResultsScheduleComponent } from '../../components/results/results-schedule/results-schedule.component';
import { ResultsErrorsComponent } from '../../components/errors/results-errors/results-errors.component';
import { nextMonthStr } from '../../helpers/date.helper';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    BasicDataFormComponent,
    OverheadCostsFormComponent,
    TranchesFormComponent,
    PrepaymentsFormComponent,
    ResultsSummaryComponent,
    ResultsChartsComponent,
    ResultsTrendChartComponent,
    ResultsScheduleComponent,
    ResultsErrorsComponent,
  ],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalculatorComponent {
  private readonly calc = inject(CalculatorService);
  private readonly formService = inject(FormService);
  private readonly calculatorState = inject(CalculatorStateService);
  private readonly selectedMonthService = inject(SelectedMonthService);

  get form() {
    return this.formService.form;
  }

  readonly results = signal<MortgageResults | null>(null);
  readonly yearlyGroups = signal<YearGroup[] | null>(null);

  get loanAmount(): number | null {
    return this.formService.form.controls.basicData.controls.loanAmount.value ?? null;
  }

  get overheadCostsEnabled(): boolean {
    return this.formService.isOverheadCostsEnabled;
  }

  get prepaymentsEnabled(): boolean {
    return this.formService.isPrepaymentEnabled;
  }

  constructor() {
    this.recalculate();
    this.form.valueChanges
      .pipe(startWith(this.form.getRawValue()), takeUntilDestroyed())
      .subscribe(() => this.recalculate());
  }

  private recalculate() {
    this.selectedMonthService.clearSelectedMonth();
    const formValue = this.form.getRawValue();
    if (this.form.valid) {
      const prepaymentsEnabled = formValue.prepayments.enabled;
      const tranchesEnabled = formValue.tranches.enabled;
      const overheadEnabled = formValue.overheadCosts.enabled;

      const prepaymentRules = prepaymentsEnabled
        ? ((formValue.prepayments.fields.prepaymentRules.items ?? []) as any[])
            .filter((r) => r && r.from && (r.frequency === PrepaymentFrequency.ONE_TIME || r.to))
            .map((r) => ({
              frequency: r.frequency as PrepaymentFrequency,
              from: r.from,
              to: r.frequency === PrepaymentFrequency.ONE_TIME ? r.from : r.to || r.from,
              amount: Number(r.amount) || 0,
              effect: r.effect as PrepaymentEffect,
            }))
        : [];

      const rataDocelowa = prepaymentsEnabled
        ? ((formValue.prepayments.fields.rataDocelowaRegula ?? {}) as any)
        : ({} as any);
      const prowizja = prepaymentsEnabled
        ? ((formValue.prepayments.fields.prowizjaWczesniejszaSplata ?? {}) as any)
        : ({} as any);

      const tranches: Tranche[] = tranchesEnabled
        ? ((formValue.tranches.fields.tranches ?? []) as any[]).map((t: any) => ({
            amount: Number(t.amount) || 0,
            date: t.date || '',
            disbursementFee: Number(t.disbursementFee) || 0,
          }))
        : [];

      const overheadCostsRaw = overheadEnabled
        ? ((formValue.overheadCosts.fields ?? {}) as any)
        : ({} as any);

      const overheadCosts: OverheadCostsInputs = overheadEnabled
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
            },
            additionalCosts: ((overheadCostsRaw.additionalCosts?.items ?? []) as any[]).map(
              (ac: any) => ({
                name: ac.name || '',
                frequency: ac.frequency,
                calcMethod: ac.calcMethod,
                value: Number(ac.value) || 0,
                from: ac.from,
              }),
            ),
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
            },
            additionalCosts: [],
            promotionalRate: {
              rateDecrease: 0,
              from: nextMonthStr(),
              to: nextMonthStr(),
            },
          };

      const basicData = formValue.basicData;
      const ratePeriods: RatePeriod[] = ((basicData.ratePeriods ?? []) as any[]).map((rp: any) => ({
        from: rp.from || basicData.startDate,
        installmentType: rp.installmentType,
        rateType: rp.rateType,
        nominalRate: Number(rp.nominalRate) || 0,
        wibor: Number(rp.wibor) || 0,
        margin: Number(rp.margin) || 0,
      }));
      const inputs: MortgageInputs = {
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
        targetInstallmentRule: prepaymentsEnabled
          ? {
              targetRate: Number(rataDocelowa.targetRate) || 0,
              from: rataDocelowa.from || nextMonthStr(),
              to: rataDocelowa.to || nextMonthStr(),
              effect:
                (rataDocelowa.effect as PrepaymentEffect) || PrepaymentEffect.LOWER_INSTALLMENT,
            }
          : {
              targetRate: 0,
              from: nextMonthStr(),
              to: nextMonthStr(),
              effect: PrepaymentEffect.LOWER_INSTALLMENT,
            },
        earlyRepaymentCommission: prepaymentsEnabled
          ? {
              ratePct: Number(prowizja.ratePct) || 0,
              validUntil: prowizja.validUntil || nextMonthStr(),
            }
          : {
              ratePct: 0,
              validUntil: nextMonthStr(),
            },
        overheadCosts,
      };
      const computedResults = this.calc.compute(inputs);
      this.results.set(computedResults);
      this.yearlyGroups.set(groupByYear(computedResults.schedule));
      this.calculatorState.results.set(computedResults);
    } else {
      this.results.set(null);
      this.yearlyGroups.set(null);
      this.calculatorState.results.set(null);
    }
  }
}

function groupByYear(rows: ScheduleRow[]): YearGroup[] {
  const out = new Map<number, YearGroup>();
  for (const row of rows) {
    const [year] = row.date.split('-').map((v) => parseInt(v, 10));
    const group = out.get(year) || {
      year,
      sumRate: 0,
      sumCapital: 0,
      sumInterest: 0,
      sumPrepayment: 0,
      sumCommission: 0,
      sumInsuranceCost: 0,
      lastRemaining: 0,
      rows: [],
    };
    group.sumRate += row.rate;
    group.sumCapital += row.capital;
    group.sumInterest += row.interest;
    group.sumPrepayment += row.prepayment;
    group.sumCommission += row.commission;
    group.sumInsuranceCost += row.insuranceCost;
    group.lastRemaining = row.remaining;
    group.rows.push(row);
    out.set(year, group);
  }
  return Array.from(out.values())
    .sort((a, b) => a.year - b.year)
    .map((group) => ({
      ...group,
      sumRate: Math.round(group.sumRate * 100) / 100,
      sumCapital: Math.round(group.sumCapital * 100) / 100,
      sumInterest: Math.round(group.sumInterest * 100) / 100,
      sumPrepayment: Math.round(group.sumPrepayment * 100) / 100,
      sumCommission: Math.round(group.sumCommission * 100) / 100,
      sumInsuranceCost: Math.round(group.sumInsuranceCost * 100) / 100,
    }));
}
