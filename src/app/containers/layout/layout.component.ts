import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  NgZone,
  signal,
  viewChild,
} from '@angular/core';

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
import { SchemaValidatorService } from '../../services/schema-validator/schema-validator.service';
import { SaveCalculationDialogComponent } from '../../dialogs/save-calculation/save-calculation-dialog.component';
import { LoadValidationErrorDialogComponent } from '../../dialogs/load-validation-error/load-validation-error-dialog.component';
import { BasicDataFormComponent } from '../../components/form/basic-data-form/basic-data-form.component';
import { OverheadCostsFormComponent } from '../../components/form/overhead-costs-form/overhead-costs-form.component';
import { TranchesFormComponent } from '../../components/form/tranches-form/tranches-form.component';
import { PrepaymentsFormComponent } from '../../components/form/prepayments-form/prepayments-form.component';
import { ResultsSummaryComponent } from '../../components/results/results-summary/results-summary.component';
import { ResultsChartsComponent } from '../../components/results/results-charts/results-charts.component';
import { ResultsScheduleComponent } from '../../components/results/results-schedule/results-schedule.component';
import { ResultsErrorsComponent } from '../../components/results/results-errors/results-errors.component';
import { IconCalculatorComponent } from '../../components/icons/icon-calculator/icon-calculator.component';

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
    SaveCalculationDialogComponent,
    LoadValidationErrorDialogComponent,
    BasicDataFormComponent,
    OverheadCostsFormComponent,
    TranchesFormComponent,
    PrepaymentsFormComponent,
    ResultsSummaryComponent,
    ResultsChartsComponent,
    ResultsScheduleComponent,
    ResultsErrorsComponent,
    IconCalculatorComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  private calc = inject(CalculatorService);
  private formService = inject(FormService);
  private schemaValidator = inject(SchemaValidatorService);
  private ngZone = inject(NgZone);
  private saveDialog = viewChild.required(SaveCalculationDialogComponent);
  private validationErrorDialog = viewChild.required(LoadValidationErrorDialogComponent);
  private fileInputEl = viewChild.required<ElementRef<HTMLInputElement>>('fileInputEl');

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
      const prepaymentsIncluded = v.prepayments.included;
      const tranchesIncluded = v.tranches.included;
      const overheadIncluded = v.overheadCosts.included;

      const prepaymentRules = prepaymentsIncluded
        ? ((v.prepayments.fields.prepaymentRules ?? []) as any[])
            .filter((r) => r && r.from && (r.frequency === PrepaymentFrequency.ONE_TIME || r.to))
            .map((r) => ({
              frequency: r.frequency as PrepaymentFrequency,
              from: r.from,
              to: r.frequency === PrepaymentFrequency.ONE_TIME ? r.from : r.to || r.from,
              amount: Number(r.amount) || 0,
              effect: r.effect as PrepaymentEffect,
            }))
        : [];

      const rataDocelowa = prepaymentsIncluded
        ? ((v.prepayments.fields.rataDocelowaRegula ?? {}) as any)
        : ({} as any);
      const prowizja = prepaymentsIncluded
        ? ((v.prepayments.fields.prowizjaWczesniejszaSplata ?? {}) as any)
        : ({} as any);

      const tranches: Tranche[] = tranchesIncluded
        ? ((v.tranches.fields.transze ?? []) as any[]).map((t: any) => ({
            amount: Number(t.amount) || 0,
            date: t.date || '',
            disbursementFee: Number(t.disbursementFee) || 0,
          }))
        : [];

      const overheadCostsRaw = overheadIncluded
        ? ((v.overheadCosts.fields ?? {}) as any)
        : ({} as any);

      const overheadCosts: OverheadCostsInputs = overheadIncluded
        ? {
            commissionPct: Number(overheadCostsRaw.commissionPct) || 0,
            appraisalFee: Number(overheadCostsRaw.appraisalFee) || 0,
            bridgeInsurance: {
              rateIncrease: Number(overheadCostsRaw.bridgeRateIncrease) || 0,
              months: Number(overheadCostsRaw.bridgeMonths) || 0,
            },
            propertyInsurance: {
              frequency: overheadCostsRaw.propInsFrequency,
              calcMethod: overheadCostsRaw.propInsCalcMethod,
              value: Number(overheadCostsRaw.propInsValue) || 0,
              from: overheadCostsRaw.propInsFrom,
              to: overheadCostsRaw.propInsTo,
            },
            lowEquityInsurance: {
              rateIncrease: Number(overheadCostsRaw.lowEquityRateIncrease) || 0,
            },
            lifeInsurance: {
              frequency: overheadCostsRaw.lifeInsFrequency,
              calcMethod: overheadCostsRaw.lifeInsCalcMethod,
              value: Number(overheadCostsRaw.lifeInsValue) || 0,
              from: overheadCostsRaw.lifeInsFrom,
              to: overheadCostsRaw.lifeInsTo,
            },
            jobLossInsurance: {
              frequency: overheadCostsRaw.jobLossInsFrequency,
              calcMethod: overheadCostsRaw.jobLossInsCalcMethod,
              value: Number(overheadCostsRaw.jobLossInsValue) || 0,
              from: overheadCostsRaw.jobLossInsFrom,
            },
            additionalCosts: ((overheadCostsRaw.additionalCosts ?? []) as any[]).map((ac: any) => ({
              name: ac.name || '',
              frequency: ac.frequency,
              calcMethod: ac.calcMethod,
              value: Number(ac.value) || 0,
              from: ac.from,
            })),
            promotionalRate: {
              rateDecrease: Number(overheadCostsRaw.promoRateDecrease) || 0,
              from: overheadCostsRaw.promoFrom,
              to: overheadCostsRaw.promoTo,
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
        targetInstallmentRule: prepaymentsIncluded
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
        earlyRepaymentCommission: prepaymentsIncluded
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

  setDefaults() {
    this.formService.setDefaults();
    this.formService.setOverheadDefaults();
  }

  loadCalculationFromFile() {
    const el = this.fileInputEl().nativeElement;
    el.value = '';
    el.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        const formData = parsed?.data ?? parsed;
        const errors = this.schemaValidator.validate(formData);
        if (errors.length > 0) {
          this.ngZone.run(() => this.validationErrorDialog().open(errors));
          return;
        }
        this.ngZone.run(() => this.formService.loadFromFile(formData));
      } catch {
        window.alert(
          'Nie udało się wczytać pliku. Upewnij się, że to prawidłowy plik kalkulacji .json.',
        );
      }
    };
    reader.readAsText(file);
  }

  async saveCalculation() {
    const defaultName = 'Kalkulacja ' + new Date().toLocaleDateString('pl-PL');
    const name = await this.saveDialog().open(defaultName);
    if (!name) return;
    const data = this.form.getRawValue();
    const all = JSON.parse(localStorage.getItem('kalkulacje') || '[]');
    const existingIdx = all.findIndex((x: any) => x.name === name);
    if (existingIdx >= 0) {
      const overwrite = window.confirm(
        `Istnieje już kalkulacja o nazwie "${name}". Czy chcesz ją nadpisać?`,
      );
      if (!overwrite) return;
    }
    const record = { name, createdAt: new Date().toISOString(), data };
    if (existingIdx >= 0) {
      all[existingIdx] = record;
    } else {
      all.push(record);
    }
    localStorage.setItem('kalkulacje', JSON.stringify(all));

    const fileName = this.sanitizeFileName(name) + '.json';
    this.downloadJsonFile(fileName, record);
  }

  private sanitizeFileName(name: string): string {
    const s = (name || '').replace(/[\\\/:*?"<>|]/g, '_').trim();
    return s || 'kalkulacja';
  }

  private downloadJsonFile(fileName: string, content: any): void {
    const json = JSON.stringify(content, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
