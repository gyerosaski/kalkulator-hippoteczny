import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MortgageCalcService,
  MortgageInputs,
  MortgageResults,
  OverheadCostsInputs,
  PrepaymentEffect,
  PrepaymentFrequency,
  PrepaymentRule,
  ScheduleRow,
  Tranche
} from '../services/mortgage-calc.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SaveCalculationDialogComponent } from './save-calculation-dialog.component';
import { startWith } from 'rxjs';
import {OverheadCostsComponent} from '../overhead-costs/overhead-costs.component';

function ym(date = new Date()): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return `${y}-${m.toString().padStart(2, '0')}`;
}

function nextMonthStr(date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return ym(d);
}

function addMonthsStr(baseYm: string, monthsToAdd: number): string {
  const [y, m] = baseYm.split('-').map((v) => parseInt(v, 10));
  const d = new Date(y, (m - 1) + monthsToAdd, 1);
  return ym(d);
}

export interface YearGroup {
  year: number;
  sumRate: number;
  sumCapital: number;
  sumInterest: number;
  sumPrepayment: number;
  sumCommission: number;
  sumInsuranceCost: number;
  lastRemaining: number;
  rows: ScheduleRow[];
}

@Component({
  selector: 'app-basic-data',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatExpansionModule, MatTableModule, MatDialogModule, OverheadCostsComponent],
  templateUrl: './basic-data.component.html',
  styleUrl: './basic-data.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BasicDataComponent {
  private fb = inject(FormBuilder);
  private calc = inject(MortgageCalcService);
  private dialog = inject(MatDialog);

  readonly prepaymentFrequencyOptions: PrepaymentFrequency[] = ['jednorazowo', 'co miesiąc', 'co kwartał', 'co rok'];
  readonly prepaymentEffectOptions: PrepaymentEffect[] = ['niższa rata', 'skrócenie okresu'];

  get nadplatyRegulyArray(): FormArray {
    return this.form.get('nadplatyReguly') as FormArray;
  }

  get transzeArray(): FormArray {
    return this.form.get('transze') as FormArray;
  }

  get transzeSuma(): number {
    const transze = this.transzeArray;
    if (!transze) return 0;
    let sum = 0;
    for (let i = 0; i < transze.length; i++) {
      sum += Number(transze.at(i).get('amount')?.value) || 0;
    }
    return Math.round(sum * 100) / 100;
  }

  // Formularz wejściowy
  form: FormGroup = this.fb.group({
    propertyValue: new FormControl(500_000, { nonNullable: true, validators: [Validators.required, Validators.min(0.01)] }),
    loanAmount: new FormControl(400_000, { nonNullable: true, validators: [Validators.required, Validators.min(0.01)] }),
    ltv: new FormControl(80, { nonNullable: true, validators: [Validators.required, Validators.min(0), Validators.max(100)] }),
    years: new FormControl(20, { nonNullable: true, validators: [Validators.min(0)] }),
    months: new FormControl(0, { nonNullable: true, validators: [Validators.min(0), Validators.max(11)] }),
    startDate: new FormControl(ym(), { nonNullable: true, validators: [Validators.required] }),
    capitalStartDate: new FormControl(nextMonthStr(), { nonNullable: true, validators: [Validators.required] }),
    installmentType: new FormControl<'rowne' | 'malejace'>('rowne', { nonNullable: true }),
    rateType: new FormControl<'zmienna' | 'stala'>('zmienna', { nonNullable: true }),
    nominalRate: new FormControl(9.0, { nonNullable: true, validators: [Validators.min(0), Validators.max(50)] }),
    wibor: new FormControl(7.0, { nonNullable: true, validators: [Validators.min(0), Validators.max(50)] }),
    margin: new FormControl(2.0, { nonNullable: true, validators: [Validators.min(0), Validators.max(50)] }),
    nadplatyReguly: this.fb.array([this.createNadplataRegulaGroup()]),
    rataDocelowaRegula: this.fb.group({
      targetRate: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
      from: new FormControl(nextMonthStr(), { nonNullable: true, validators: [Validators.required] }),
      to: new FormControl(addMonthsStr(nextMonthStr(), 12), { nonNullable: true, validators: [Validators.required] }),
      effect: new FormControl<PrepaymentEffect>('niższa rata', { nonNullable: true, validators: [Validators.required] })
    }),
    prowizjaWczesniejszaSplata: this.fb.group({
      ratePct: new FormControl(0, { nonNullable: true, validators: [Validators.min(0), Validators.max(100)] }),
      validUntil: new FormControl(addMonthsStr(nextMonthStr(), 36), { nonNullable: true, validators: [Validators.required] })
    }),
    transze: this.fb.array([this.createTrancheGroup(true)])
  }, { validators: [crossFieldValidator] });

  // Wyniki
  results = signal<MortgageResults | null>(null);
  yearlyGroups = signal<YearGroup[] | null>(null);
  displayedColumns: string[] = ['date', 'rate', 'capital', 'interest', 'prepayment', 'commission', 'remaining'];

  // Obserwacja zmian formularza i przeliczenia
  constructor() {
    // Pierwsze wyliczenie i subskrypcja zmian
    this.recalculate();
    this.form.valueChanges
      .pipe(startWith(this.form.getRawValue()), takeUntilDestroyed())
      .subscribe(() => this.recalculate());
  }

  private recalculate() {
    const v = this.form.getRawValue();
    if (this.form.valid) {
      const prepaymentRules = ((v.nadplatyReguly ?? []) as any[])
        .filter((r) => r && r.from && (r.frequency === 'jednorazowo' || r.to))
        .map((r) => ({
          frequency: r.frequency as PrepaymentFrequency,
          from: r.from,
          to: r.frequency === 'jednorazowo' ? r.from : (r.to || r.from),
          amount: Number(r.amount) || 0,
          effect: r.effect as PrepaymentEffect
        }));

      const rataDocelowa = (v.rataDocelowaRegula ?? {}) as any;
      const prowizja = (v.prowizjaWczesniejszaSplata ?? {}) as any;

      const tranches: Tranche[] = ((v.transze ?? []) as any[]).map((t: any) => ({
        amount: Number(t.amount) || 0,
        date: t.date || '',
        disbursementFee: Number(t.disbursementFee) || 0
      }));

      const inputs: MortgageInputs = {
        propertyValue: v.propertyValue,
        loanAmount: v.loanAmount,
        ltv: v.ltv,
        years: v.years,
        months: v.months,
        startDate: v.startDate,
        capitalStartDate: v.capitalStartDate,
        installmentType: v.installmentType,
        rateType: v.rateType,
        nominalRate: v.nominalRate,
        wibor: v.wibor,
        margin: v.margin,
        prepaymentRules,
        tranches,
        targetInstallmentRule: {
          targetRate: Number(rataDocelowa.targetRate) || 0,
          from: rataDocelowa.from || nextMonthStr(),
          to: rataDocelowa.to || nextMonthStr(),
          effect: (rataDocelowa.effect as PrepaymentEffect) || 'niższa rata'
        },
        earlyRepaymentCommission: {
          ratePct: Number(prowizja.ratePct) || 0,
          validUntil: prowizja.validUntil || nextMonthStr()
        },
        overheadCosts: (v as any).overheadCosts as OverheadCostsInputs | undefined
      };
      const res = this.calc.compute(inputs);
      this.results.set(res);
      this.yearlyGroups.set(groupByYear(res.schedule));
    } else {
      this.results.set(null);
      this.yearlyGroups.set(null);
    }
  }

  // Handlery spójności LTV/kwota/wartość
  onLtvChanged() {
    const v = this.form.getRawValue();
    const synced = this.calc.syncLtvAmountValue(v.propertyValue, v.loanAmount, v.ltv, 'ltv');
    this.form.patchValue(synced, { emitEvent: false });
    // manual recalc trigger by touching a dummy
    this.form.updateValueAndValidity();
  }

  onLoanAmountChanged() {
    const v = this.form.getRawValue();
    const synced = this.calc.syncLtvAmountValue(v.propertyValue, v.loanAmount, v.ltv, 'loanAmount');
    this.form.patchValue(synced, { emitEvent: false });
    this.form.updateValueAndValidity();
  }

  onPropertyValueChanged() {
    const v = this.form.getRawValue();
    const synced = this.calc.syncLtvAmountValue(v.propertyValue, v.loanAmount, v.ltv, 'propertyValue');
    this.form.patchValue(synced, { emitEvent: false });
    this.form.updateValueAndValidity();
  }

  addTransza() {
    const startDate = this.form.get('startDate')?.value || ym();
    const nextDate = addMonthsStr(startDate, this.transzeArray.length);
    this.transzeArray.push(this.createTrancheGroup(false, { date: nextDate }));
    this.form.updateValueAndValidity();
  }

  removeTransza(index: number) {
    if (index === 0 || this.transzeArray.length <= 1) return;
    this.transzeArray.removeAt(index);
    this.form.updateValueAndValidity();
  }

  clearTransze() {
    const loanAmount = this.form.get('loanAmount')?.value || 0;
    const startDate = this.form.get('startDate')?.value || ym();
    this.form.setControl('transze', this.fb.array([
      this.createTrancheGroup(true, { amount: loanAmount, date: startDate })
    ]));
    this.form.updateValueAndValidity();
  }

  addNadplataRegula() {
    this.nadplatyRegulyArray.push(this.createNadplataRegulaGroup());
    this.form.updateValueAndValidity();
  }

  removeNadplataRegula(index: number) {
    if (this.nadplatyRegulyArray.length <= 1) return;
    this.nadplatyRegulyArray.removeAt(index);
    this.form.updateValueAndValidity();
  }

  onNadplataFrequencyChanged(index: number) {
    const ruleGroup = this.nadplatyRegulyArray.at(index) as FormGroup | null;
    if (!ruleGroup) return;

    const frequency = ruleGroup.get('frequency')?.value as PrepaymentFrequency | undefined;
    const from = ruleGroup.get('from')?.value as string | undefined;
    const toControl = ruleGroup.get('to');
    if (!toControl) return;

    if (frequency === 'jednorazowo' && from) {
      toControl.setValue(from);
    } else if (frequency !== 'jednorazowo' && !toControl.value && from) {
      toControl.setValue(addMonthsStr(from, 12));
    }

    this.form.updateValueAndValidity();
  }

  onNadplataFromChanged(index: number) {
    const ruleGroup = this.nadplatyRegulyArray.at(index) as FormGroup | null;
    if (!ruleGroup) return;

    const frequency = ruleGroup.get('frequency')?.value as PrepaymentFrequency | undefined;
    const from = ruleGroup.get('from')?.value as string | undefined;
    const toControl = ruleGroup.get('to');
    if (frequency === 'jednorazowo' && from && toControl && toControl.value !== from) {
      toControl.setValue(from);
    }
    this.form.updateValueAndValidity();
  }

  formatMonthPl(month: string | null | undefined): string {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) return '';
    const [y, m] = month.split('-').map((v) => parseInt(v, 10));
    const d = new Date(y, m - 1, 1);
    return new Intl.DateTimeFormat('pl-PL', { month: 'short', year: 'numeric' }).format(d);
  }

  // Akcje
  setDefaults() {
    this.form.patchValue({
      propertyValue: 500_000,
      loanAmount: 400_000,
      ltv: 80,
      years: 20,
      months: 0,
      startDate: ym(),
      capitalStartDate: nextMonthStr(),
      installmentType: 'rowne',
      rateType: 'zmienna',
      wibor: 7.0,
      margin: 2.0,
      nominalRate: 9.0,
      rataDocelowaRegula: {
        targetRate: 0,
        from: nextMonthStr(),
        to: addMonthsStr(nextMonthStr(), 12),
        effect: 'niższa rata'
      },
      prowizjaWczesniejszaSplata: {
        ratePct: 0,
        validUntil: addMonthsStr(nextMonthStr(), 36)
      }
    });
    this.form.setControl('nadplatyReguly', this.fb.array([this.createNadplataRegulaGroup()]));
    this.form.setControl('transze', this.fb.array([this.createTrancheGroup(true)]));
  }

  clearAll() {
    this.form.reset({
      propertyValue: null,
      loanAmount: null,
      ltv: null,
      years: 0,
      months: 0,
      startDate: ym(),
      capitalStartDate: nextMonthStr(),
      installmentType: 'rowne',
      rateType: 'zmienna',
      nominalRate: 0,
      wibor: 0,
      margin: 0,
      rataDocelowaRegula: {
        targetRate: 0,
        from: nextMonthStr(),
        to: nextMonthStr(),
        effect: 'niższa rata'
      },
      prowizjaWczesniejszaSplata: {
        ratePct: 0,
        validUntil: nextMonthStr()
      }
    } as any);
    this.form.setControl('nadplatyReguly', this.fb.array([this.createNadplataRegulaGroup({ to: nextMonthStr() })]));
    this.form.setControl('transze', this.fb.array([this.createTrancheGroup(true, { amount: 0 })]));
  }

  saveCalculation() {
    const dlgRef = this.dialog.open(SaveCalculationDialogComponent, {
      data: { defaultName: 'Kalkulacja ' + new Date().toLocaleDateString('pl-PL') }
    });
    dlgRef.afterClosed().subscribe((name) => {
      if (!name) return;
      const data = this.form.getRawValue();
      const all = JSON.parse(localStorage.getItem('kalkulacje') || '[]');
      const existingIdx = all.findIndex((x: any) => x.name === name);
      if (existingIdx >= 0) {
        const overwrite = window.confirm(`Istnieje już kalkulacja o nazwie "${name}". Czy chcesz ją nadpisać?`);
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
    });
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

  // Pomocnicze computed
  readonly rateLabel = computed(() => this.form.get('rateType')?.value === 'stala' ? 'Oprocentowanie (stałe, %)' : 'Oprocentowanie = WIBOR + Marża (tylko do odczytu)');

  private createTrancheGroup(isFirst: boolean, initial: Partial<Tranche> = {}): FormGroup {
    const startDate = this.form?.get('startDate')?.value || ym();
    const amount = initial.amount ?? (isFirst ? (this.form?.get('loanAmount')?.value || 0) : 0);
    const date = initial.date ?? startDate;
    const group = this.fb.group({
      amount: new FormControl(amount, { nonNullable: true, validators: isFirst ? [] : [Validators.required, Validators.min(0.01)] }),
      date: new FormControl(date, { nonNullable: true, validators: [Validators.required] }),
      disbursementFee: new FormControl(initial.disbursementFee ?? 0, { nonNullable: true, validators: [Validators.min(0), Validators.max(1000)] })
    });
    return group;
  }

  private createNadplataRegulaGroup(initial: Partial<PrepaymentRule> = {}): FormGroup {
    const frequency = initial.frequency ?? 'jednorazowo';
    const from = initial.from ?? nextMonthStr();
    const to = frequency === 'jednorazowo' ? from : (initial.to ?? addMonthsStr(from, 12));
    return this.fb.group({
      frequency: new FormControl<PrepaymentFrequency>(frequency, { nonNullable: true, validators: [Validators.required] }),
      from: new FormControl(from, { nonNullable: true, validators: [Validators.required] }),
      to: new FormControl(to, { nonNullable: true, validators: [Validators.required] }),
      amount: new FormControl(initial.amount ?? 0, { nonNullable: true, validators: [Validators.min(0)] }),
      effect: new FormControl<PrepaymentEffect>(initial.effect ?? 'niższa rata', { nonNullable: true, validators: [Validators.required] })
    });
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
      rows: []
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
  const res = Array.from(out.values()).sort((a, b) => a.year - b.year).map(g => ({
    ...g,
    sumRate: Math.round(g.sumRate * 100) / 100,
    sumCapital: Math.round(g.sumCapital * 100) / 100,
    sumInterest: Math.round(g.sumInterest * 100) / 100,
    sumPrepayment: Math.round(g.sumPrepayment * 100) / 100,
    sumCommission: Math.round(g.sumCommission * 100) / 100,
    sumInsuranceCost: Math.round(g.sumInsuranceCost * 100) / 100,
  }));
  return res;
}

function crossFieldValidator(group: FormGroup) {
  const pv = group.get('propertyValue')?.value ?? 0;
  const la = group.get('loanAmount')?.value ?? 0;
  const yrs = group.get('years')?.value ?? 0;
  const mos = group.get('months')?.value ?? 0;
  const start = group.get('startDate')?.value as string;
  const capStart = group.get('capitalStartDate')?.value as string;
  const nadplatyReguly = (group.get('nadplatyReguly')?.value ?? []) as Array<{ frequency?: PrepaymentFrequency; from: string; to?: string; amount: number }>;
  const rataDocelowaRegula = (group.get('rataDocelowaRegula')?.value ?? {}) as { from?: string; to?: string; targetRate?: number };
  const transzeArray = group.get('transze') as FormArray | null;

  const errors: any = {};
  if (pv && la && la > pv) errors.loanGtProperty = true;

  // Walidacja sumy transz
  if (transzeArray && transzeArray.length > 1 && la > 0) {
    let transzeSum = 0;
    for (let i = 0; i < transzeArray.length; i++) {
      transzeSum += Number(transzeArray.at(i).get('amount')?.value) || 0;
    }
    transzeSum = Math.round(transzeSum * 100) / 100;
    if (Math.abs(transzeSum - la) > 0.01) {
      errors.transzeSumMismatch = { expected: la, actual: transzeSum, diff: Math.round((transzeSum - la) * 100) / 100 };
    }
  }
  const n = Math.trunc(yrs) * 12 + Math.trunc(mos);
  if (n <= 0) errors.totalMonthsInvalid = true;
  // capital start cannot be before start
  if (start && capStart) {
    if (capStart < start) errors.capitalBeforeStart = true;
  }

  for (const rule of nadplatyReguly) {
    if (rule.frequency !== 'jednorazowo' && rule.from && rule.to && rule.to < rule.from) {
      errors.prepaymentDateRangeInvalid = true;
    }
    if ((Number(rule.amount) || 0) < 0) {
      errors.prepaymentAmountInvalid = true;
    }
  }

  if (rataDocelowaRegula.from && rataDocelowaRegula.to && rataDocelowaRegula.to < rataDocelowaRegula.from) {
    errors.targetInstallmentDateRangeInvalid = true;
  }

  if ((Number(rataDocelowaRegula.targetRate) || 0) < 0) {
    errors.targetInstallmentInvalid = true;
  }

  return Object.keys(errors).length ? errors : null;
}
