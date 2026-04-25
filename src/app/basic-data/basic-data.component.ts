import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MortgageCalcService, MortgageInputs, MortgageResults, ScheduleRow } from '../services/mortgage-calc.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SaveCalculationDialogComponent } from './save-calculation-dialog.component';
import { startWith } from 'rxjs';

function ym(date = new Date()): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return `${y}-${m.toString().padStart(2, '0')}`;
}

function nextMonthStr(date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return ym(d);
}

export interface YearGroup {
  year: number;
  sumRate: number;
  sumCapital: number;
  sumInterest: number;
  lastRemaining: number;
  rows: ScheduleRow[];
}

@Component({
  selector: 'app-basic-data',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatExpansionModule, MatTableModule, MatDialogModule],
  templateUrl: './basic-data.component.html',
  styleUrl: './basic-data.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BasicDataComponent {
  private fb = inject(FormBuilder);
  private calc = inject(MortgageCalcService);
  private dialog = inject(MatDialog);

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
    margin: new FormControl(2.0, { nonNullable: true, validators: [Validators.min(0), Validators.max(50)] })
  }, { validators: [crossFieldValidator] });

  // Wyniki
  results = signal<MortgageResults | null>(null);
  yearlyGroups = signal<YearGroup[] | null>(null);
  displayedColumns: string[] = ['date', 'rate', 'capital', 'interest', 'remaining'];

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
        margin: v.margin
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
      nominalRate: 9.0
    });
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
      margin: 0
    } as any);
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
}

function groupByYear(rows: ScheduleRow[]): YearGroup[] {
  const out = new Map<number, YearGroup>();
  for (const r of rows) {
    const [yy, mm] = r.date.split('-').map((v) => parseInt(v, 10));
    const g = out.get(yy) || { year: yy, sumRate: 0, sumCapital: 0, sumInterest: 0, lastRemaining: 0, rows: [] };
    g.sumRate += r.rate;
    g.sumCapital += r.capital;
    g.sumInterest += r.interest;
    g.lastRemaining = r.remaining; // ostatni w roku nadpisze poprawnie
    g.rows.push(r);
    out.set(yy, g);
  }
  // Zaokrąglij sumy i posortuj lata rosnąco
  const res = Array.from(out.values()).sort((a, b) => a.year - b.year).map(g => ({
    ...g,
    sumRate: Math.round(g.sumRate * 100) / 100,
    sumCapital: Math.round(g.sumCapital * 100) / 100,
    sumInterest: Math.round(g.sumInterest * 100) / 100,
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

  const errors: any = {};
  if (pv && la && la > pv) errors.loanGtProperty = true;
  const n = Math.trunc(yrs) * 12 + Math.trunc(mos);
  if (n <= 0) errors.totalMonthsInvalid = true;
  // capital start cannot be before start
  if (start && capStart) {
    if (capStart < start) errors.capitalBeforeStart = true;
  }
  return Object.keys(errors).length ? errors : null;
}
