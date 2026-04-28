import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {startWith} from 'rxjs';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatTableModule} from '@angular/material/table';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {SaveCalculationDialogComponent} from '../../dialogs/save-calculation/save-calculation-dialog.component';
import {
  InsuranceCalcMethod,
  InsuranceFrequency, LifeInsuranceCalcMethod,
  CalculatorService, MortgageInputs, MortgageResults, OverheadCostsInputs, PrepaymentEffect
} from '../../services/calculator/calculator.service';

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

function endOfLoanDate(): string {
  // Domyślnie: 20 lat od teraz
  return addMonthsStr(nextMonthStr(), 20 * 12 - 1);
}

@Component({
  selector: 'app-overhead-costs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatExpansionModule, MatTableModule, MatDialogModule],
  templateUrl: './overhead-costs.component.html',
  styleUrl: './overhead-costs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverheadCostsComponent {
  private fb = inject(FormBuilder);
  private calc = inject(CalculatorService);
  private dialog = inject(MatDialog);

  readonly insuranceFrequencyOptions: InsuranceFrequency[] = ['co rok', 'co miesiąc', 'jednorazowo'];
  readonly propertyInsFrequencyOptions: ('co rok' | 'co miesiąc')[] = ['co rok', 'co miesiąc'];
  readonly propertyInsCalcOptions: InsuranceCalcMethod[] = ['% wartości nieruchomości', '% kwoty kredytu', '% salda kredytu', 'znam kwotę'];
  readonly lifeInsCalcOptions: LifeInsuranceCalcMethod[] = ['% kwoty kredytu', '% salda kredytu', 'znam kwotę'];
  readonly prepaymentEffectOptions: PrepaymentEffect[] = ['niższa rata', 'skrócenie okresu'];

  get additionalCostsArray(): FormArray {
    return this.form.get('additionalCosts') as FormArray;
  }

  // Formularz główny – dane podstawowe + koszty okołokredytowe
  form: FormGroup = this.fb.group({
    // Dane podstawowe (identyczne jak w BasicDataComponent)
    propertyValue: new FormControl(500_000, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01)]
    }),
    loanAmount: new FormControl(400_000, {nonNullable: true, validators: [Validators.required, Validators.min(0.01)]}),
    ltv: new FormControl(80, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(100)]
    }),
    years: new FormControl(20, {nonNullable: true, validators: [Validators.min(0)]}),
    months: new FormControl(0, {nonNullable: true, validators: [Validators.min(0), Validators.max(11)]}),
    startDate: new FormControl(ym(), {nonNullable: true, validators: [Validators.required]}),
    capitalStartDate: new FormControl(nextMonthStr(), {nonNullable: true, validators: [Validators.required]}),
    installmentType: new FormControl<'rowne' | 'malejace'>('rowne', {nonNullable: true}),
    rateType: new FormControl<'zmienna' | 'stala'>('zmienna', {nonNullable: true}),
    nominalRate: new FormControl(9.0, {nonNullable: true, validators: [Validators.min(0), Validators.max(50)]}),
    wibor: new FormControl(7.0, {nonNullable: true, validators: [Validators.min(0), Validators.max(50)]}),
    margin: new FormControl(2.0, {nonNullable: true, validators: [Validators.min(0), Validators.max(50)]}),

    // 1. Prowizja za udzielenie
    commissionPct: new FormControl(0, {nonNullable: true, validators: [Validators.min(0), Validators.max(100)]}),
    // 2. Opłata za wycenę
    appraisalFee: new FormControl(0, {nonNullable: true, validators: [Validators.min(0)]}),
    // 3. Ubezpieczenie pomostowe
    bridgeRateIncrease: new FormControl(0, {nonNullable: true, validators: [Validators.min(0)]}),
    bridgeMonths: new FormControl(0, {nonNullable: true, validators: [Validators.min(0)]}),
    // 4. Ubezpieczenie nieruchomości
    propInsFrequency: new FormControl<'co rok' | 'co miesiąc'>('co rok', {nonNullable: true}),
    propInsCalcMethod: new FormControl<InsuranceCalcMethod>('% wartości nieruchomości', {nonNullable: true}),
    propInsValue: new FormControl(0, {nonNullable: true, validators: [Validators.min(0)]}),
    propInsFrom: new FormControl(nextMonthStr(), {nonNullable: true}),
    propInsTo: new FormControl(endOfLoanDate(), {nonNullable: true}),
    // 5. Ubezpieczenie niskiego wkładu
    lowEquityRateIncrease: new FormControl(0, {nonNullable: true, validators: [Validators.min(0)]}),
    // 6. Ubezpieczenie na życie
    lifeInsFrequency: new FormControl<InsuranceFrequency>('co rok', {nonNullable: true}),
    lifeInsCalcMethod: new FormControl<LifeInsuranceCalcMethod>('% kwoty kredytu', {nonNullable: true}),
    lifeInsValue: new FormControl(0, {nonNullable: true, validators: [Validators.min(0)]}),
    lifeInsFrom: new FormControl(nextMonthStr(), {nonNullable: true}),
    lifeInsTo: new FormControl(endOfLoanDate(), {nonNullable: true}),
    // 7. Ubezpieczenie od utraty pracy
    jobLossInsFrequency: new FormControl<InsuranceFrequency>('jednorazowo', {nonNullable: true}),
    jobLossInsCalcMethod: new FormControl<LifeInsuranceCalcMethod>('% kwoty kredytu', {nonNullable: true}),
    jobLossInsValue: new FormControl(0, {nonNullable: true, validators: [Validators.min(0)]}),
    jobLossInsFrom: new FormControl(nextMonthStr(), {nonNullable: true}),
    // 8. Dodatkowe koszty
    additionalCosts: this.fb.array([this.createAdditionalCostGroup()]),
    // 9. Promocyjna wysokość oprocentowania
    promoRateDecrease: new FormControl(0, {nonNullable: true, validators: [Validators.min(0)]}),
    promoFrom: new FormControl(nextMonthStr(), {nonNullable: true}),
    promoTo: new FormControl(addMonthsStr(nextMonthStr(), 12), {nonNullable: true})
  });

  // Computed: prowizja w zł
  readonly commissionAmount = computed(() => {
    const v = this.form?.getRawValue();
    if (!v) return 0;
    return Math.round((v.loanAmount || 0) * (v.commissionPct || 0)) / 100;
  });

  results = signal<MortgageResults | null>(null);

  constructor() {
    this.recalculate();
    this.form.valueChanges
      .pipe(startWith(this.form.getRawValue()), takeUntilDestroyed())
      .subscribe(() => this.recalculate());
  }

  private recalculate() {
    const v = this.form.getRawValue();

    const overheadCosts: OverheadCostsInputs = {
      commissionPct: Number(v.commissionPct) || 0,
      appraisalFee: Number(v.appraisalFee) || 0,
      bridgeInsurance: {
        rateIncrease: Number(v.bridgeRateIncrease) || 0,
        months: Number(v.bridgeMonths) || 0
      },
      propertyInsurance: {
        frequency: v.propInsFrequency,
        calcMethod: v.propInsCalcMethod,
        value: Number(v.propInsValue) || 0,
        from: v.propInsFrom,
        to: v.propInsTo
      },
      lowEquityInsurance: {
        rateIncrease: Number(v.lowEquityRateIncrease) || 0
      },
      lifeInsurance: {
        frequency: v.lifeInsFrequency,
        calcMethod: v.lifeInsCalcMethod,
        value: Number(v.lifeInsValue) || 0,
        from: v.lifeInsFrom,
        to: v.lifeInsTo
      },
      jobLossInsurance: {
        frequency: v.jobLossInsFrequency,
        calcMethod: v.jobLossInsCalcMethod,
        value: Number(v.jobLossInsValue) || 0,
        from: v.jobLossInsFrom
      },
      additionalCosts: ((v.additionalCosts ?? []) as any[]).map((ac: any) => ({
        name: ac.name || '',
        frequency: ac.frequency as InsuranceFrequency,
        calcMethod: ac.calcMethod as LifeInsuranceCalcMethod,
        value: Number(ac.value) || 0,
        from: ac.from || nextMonthStr()
      })),
      promotionalRate: {
        rateDecrease: Number(v.promoRateDecrease) || 0,
        from: v.promoFrom,
        to: v.promoTo
      }
    };

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
      overheadCosts
    };

    const res = this.calc.compute(inputs);
    this.results.set(res);
  }

  // Handlery spójności LTV/kwota/wartość
  onLtvChanged() {
    const v = this.form.getRawValue();
    const synced = this.calc.syncLtvAmountValue(v.propertyValue, v.loanAmount, v.ltv, 'ltv');
    this.form.patchValue(synced, {emitEvent: false});
    this.form.updateValueAndValidity();
  }

  onLoanAmountChanged() {
    const v = this.form.getRawValue();
    const synced = this.calc.syncLtvAmountValue(v.propertyValue, v.loanAmount, v.ltv, 'loanAmount');
    this.form.patchValue(synced, {emitEvent: false});
    this.form.updateValueAndValidity();
  }

  onPropertyValueChanged() {
    const v = this.form.getRawValue();
    const synced = this.calc.syncLtvAmountValue(v.propertyValue, v.loanAmount, v.ltv, 'propertyValue');
    this.form.patchValue(synced, {emitEvent: false});
    this.form.updateValueAndValidity();
  }

  addAdditionalCost() {
    this.additionalCostsArray.push(this.createAdditionalCostGroup());
    this.form.updateValueAndValidity();
  }

  removeAdditionalCost(index: number) {
    if (this.additionalCostsArray.length <= 1) return;
    this.additionalCostsArray.removeAt(index);
    this.form.updateValueAndValidity();
  }

  formatMonthPl(month: string | null | undefined): string {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) return '';
    const [y, m] = month.split('-').map((v) => parseInt(v, 10));
    const d = new Date(y, m - 1, 1);
    return new Intl.DateTimeFormat('pl-PL', {month: 'short', year: 'numeric'}).format(d);
  }

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
      commissionPct: 1.50,
      appraisalFee: 400,
      bridgeRateIncrease: 1.20,
      bridgeMonths: 6,
      propInsFrequency: 'co rok',
      propInsCalcMethod: '% wartości nieruchomości',
      propInsValue: 0.0008,
      propInsFrom: nextMonthStr(),
      propInsTo: endOfLoanDate(),
      lowEquityRateIncrease: 0,
      lifeInsFrequency: 'co rok',
      lifeInsCalcMethod: '% kwoty kredytu',
      lifeInsValue: 0,
      lifeInsFrom: nextMonthStr(),
      lifeInsTo: endOfLoanDate(),
      jobLossInsFrequency: 'jednorazowo',
      jobLossInsCalcMethod: '% kwoty kredytu',
      jobLossInsValue: 0,
      jobLossInsFrom: nextMonthStr(),
      promoRateDecrease: 0,
      promoFrom: nextMonthStr(),
      promoTo: addMonthsStr(nextMonthStr(), 12)
    });
    this.form.setControl('additionalCosts', this.fb.array([this.createAdditionalCostGroup()]));
  }

  clearAll() {
    this.form.patchValue({
      commissionPct: 0,
      appraisalFee: 0,
      bridgeRateIncrease: 0,
      bridgeMonths: 0,
      propInsFrequency: 'co rok',
      propInsCalcMethod: '% wartości nieruchomości',
      propInsValue: 0,
      propInsFrom: nextMonthStr(),
      propInsTo: endOfLoanDate(),
      lowEquityRateIncrease: 0,
      lifeInsFrequency: 'co rok',
      lifeInsCalcMethod: '% kwoty kredytu',
      lifeInsValue: 0,
      lifeInsFrom: nextMonthStr(),
      lifeInsTo: endOfLoanDate(),
      jobLossInsFrequency: 'jednorazowo',
      jobLossInsCalcMethod: '% kwoty kredytu',
      jobLossInsValue: 0,
      jobLossInsFrom: nextMonthStr(),
      promoRateDecrease: 0,
      promoFrom: nextMonthStr(),
      promoTo: addMonthsStr(nextMonthStr(), 12)
    });
    this.form.setControl('additionalCosts', this.fb.array([this.createAdditionalCostGroup()]));
  }

  saveCalculation() {
    const dlgRef = this.dialog.open(SaveCalculationDialogComponent, {
      data: {defaultName: 'Kalkulacja ' + new Date().toLocaleDateString('pl-PL')}
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
      const record = {name, createdAt: new Date().toISOString(), data};
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
    const blob = new Blob([json], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private createAdditionalCostGroup(): FormGroup {
    return this.fb.group({
      name: new FormControl('', {nonNullable: true}),
      frequency: new FormControl<InsuranceFrequency>('jednorazowo', {nonNullable: true}),
      calcMethod: new FormControl<LifeInsuranceCalcMethod>('znam kwotę', {nonNullable: true}),
      value: new FormControl(0, {nonNullable: true, validators: [Validators.min(0)]}),
      from: new FormControl(nextMonthStr(), {nonNullable: true})
    });
  }
}
