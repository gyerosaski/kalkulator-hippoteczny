import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import {
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
} from '../../model/mortgage.model';
import { CalculatorService } from '../../services/calculator/calculator.service';
import { FormService } from '../../services/form/form';
import { ThemeService } from '../../services/theme/theme.service';
import { TopbarComponent } from '../topbar/topbar.component';
import { BasicDataFormComponent } from '../../components/form/basic-data-form/basic-data-form.component';
import { OverheadCostsFormComponent } from '../../components/form/overhead-costs-form/overhead-costs-form.component';
import { TranchesFormComponent } from '../../components/form/tranches-form/tranches-form.component';
import { PrepaymentsFormComponent } from '../../components/form/prepayments-form/prepayments-form.component';
import { ResultsSummaryComponent } from '../../components/results/results-summary/results-summary.component';
import { ResultsChartsComponent } from '../../components/results/results-charts/results-charts.component';
import { ResultsScheduleComponent } from '../../components/results/results-schedule/results-schedule.component';
import { ResultsErrorsComponent } from '../../components/errors/results-errors/results-errors.component';

function ym(date = new Date()): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return `${y}-${m.toString().padStart(2, '0')}`;
}

function nextMonthStr(date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return ym(d);
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TopbarComponent,
    BasicDataFormComponent,
    OverheadCostsFormComponent,
    TranchesFormComponent,
    PrepaymentsFormComponent,
    ResultsSummaryComponent,
    ResultsChartsComponent,
    ResultsScheduleComponent,
    ResultsErrorsComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  private calc = inject(CalculatorService);
  private formService = inject(FormService);
  protected themeService = inject(ThemeService);

  get form() {
    return this.formService.form;
  }

  results = signal<MortgageResults | null>(null);
  yearlyGroups = signal<YearGroup[] | null>(null);

  constructor() {
    this.recalculate();
    this.form.valueChanges
      .pipe(startWith(this.form.getRawValue()), takeUntilDestroyed())
      .subscribe(() => this.recalculate());
  }

  private recalculate() {
    const v = this.form.getRawValue();
    if (this.form.valid) {
      const prepaymentsEnabled = v.prepayments.enabled;
      const tranchesEnabled = v.tranches.enabled;
      const overheadEnabled = v.overheadCosts.enabled;

      const prepaymentRules = prepaymentsEnabled
        ? ((v.prepayments.fields.prepaymentRules.items ?? []) as any[])
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
        ? ((v.prepayments.fields.rataDocelowaRegula ?? {}) as any)
        : ({} as any);
      const prowizja = prepaymentsEnabled
        ? ((v.prepayments.fields.prowizjaWczesniejszaSplata ?? {}) as any)
        : ({} as any);

      const tranches: Tranche[] = tranchesEnabled
        ? ((v.tranches.fields.tranches ?? []) as any[]).map((t: any) => ({
            amount: Number(t.amount) || 0,
            date: t.date || '',
            disbursementFee: Number(t.disbursementFee) || 0,
          }))
        : [];

      const overheadCostsRaw = overheadEnabled
        ? ((v.overheadCosts.fields ?? {}) as any)
        : ({} as any);

      const overheadCosts: OverheadCostsInputs = overheadEnabled
        ? {
            commissionPct: Number(overheadCostsRaw.commission?.commissionPct) || 0,
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
            commissionPct: 0,
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

      const bd = v.basicData;
      const ratePeriods: RatePeriod[] = ((bd.ratePeriods ?? []) as any[]).map((rp: any) => ({
        from: rp.from || bd.startDate,
        installmentType: rp.installmentType,
        rateType: rp.rateType,
        nominalRate: Number(rp.nominalRate) || 0,
        wibor: Number(rp.wibor) || 0,
        margin: Number(rp.margin) || 0,
      }));
      const inputs: MortgageInputs = {
        propertyValue: bd.propertyValue,
        loanAmount: bd.loanAmount,
        ltv: bd.ltv,
        loanPeriod: bd.loanPeriod,
        startDate: bd.startDate,
        capitalStartDate: bd.capitalStartDate,
        installmentType: bd.installmentType,
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
      const res = this.calc.compute(inputs);
      this.results.set(res);
      this.yearlyGroups.set(groupByYear(res.schedule));
    } else {
      this.results.set(null);
      this.yearlyGroups.set(null);
    }
  }
}

function groupByYear(rows: ScheduleRow[]): YearGroup[] {
  const out = new Map<number, YearGroup>();
  for (const r of rows) {
    const [yy] = r.date.split('-').map((v) => parseInt(v, 10));
    const g = out.get(yy) || {
      year: yy,
      sumRate: 0,
      sumCapital: 0,
      sumInterest: 0,
      sumPrepayment: 0,
      sumCommission: 0,
      sumInsuranceCost: 0,
      lastRemaining: 0,
      rows: [],
    };
    g.sumRate += r.rate;
    g.sumCapital += r.capital;
    g.sumInterest += r.interest;
    g.sumPrepayment += r.prepayment;
    g.sumCommission += r.commission;
    g.sumInsuranceCost += r.insuranceCost;
    g.lastRemaining = r.remaining;
    g.rows.push(r);
    out.set(yy, g);
  }
  return Array.from(out.values())
    .sort((a, b) => a.year - b.year)
    .map((g) => ({
      ...g,
      sumRate: Math.round(g.sumRate * 100) / 100,
      sumCapital: Math.round(g.sumCapital * 100) / 100,
      sumInterest: Math.round(g.sumInterest * 100) / 100,
      sumPrepayment: Math.round(g.sumPrepayment * 100) / 100,
      sumCommission: Math.round(g.sumCommission * 100) / 100,
      sumInsuranceCost: Math.round(g.sumInsuranceCost * 100) / 100,
    }));
}
