import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormService } from '../../../services/form/form';
import { FormError, FormErrorSection } from '../../../model/mortgage.model';
import { IconWarningComponent } from '../../icons/icon-warning/icon-warning.component';
import { IconWarningSmComponent } from '../../icons/icon-warning-sm/icon-warning-sm.component';

function pluralErr(n: number): string {
  if (n === 1) return '1 błąd';
  const lastTwo = n % 100;
  const last = n % 10;
  if (lastTwo >= 12 && lastTwo <= 14) return `${n} błędów`;
  if (last >= 2 && last <= 4) return `${n} błędy`;
  return `${n} błędów`;
}

interface ErrorGroup {
  section: FormErrorSection;
  items: FormError[];
}

@Component({
  selector: 'app-results-errors',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconWarningComponent, IconWarningSmComponent],
  templateUrl: './results-errors.component.html',
  styleUrl: './results-errors.component.scss',
})
export class ResultsErrorsComponent {
  private readonly formService = inject(FormService);

  private readonly _formVersion = toSignal(this.formService.form.valueChanges, {
    initialValue: undefined,
  });

  readonly errors = computed((): FormError[] => {
    this._formVersion();
    return this.buildErrors();
  });

  readonly groups = computed((): ErrorGroup[] => {
    const order = [
      FormErrorSection.BASIC_DATA,
      FormErrorSection.TRANCHES,
      FormErrorSection.PREPAYMENTS,
      FormErrorSection.OVERHEAD_COSTS,
    ];
    const bySection: Partial<Record<FormErrorSection, FormError[]>> = {};
    for (const e of this.errors()) {
      (bySection[e.section] ??= []).push(e);
    }
    return order.filter((s) => bySection[s]).map((s) => ({ section: s, items: bySection[s]! }));
  });

  readonly totalLabel = computed(() => pluralErr(this.errors().length));

  pluralFor(n: number): string {
    return pluralErr(n);
  }

  private buildErrors(): FormError[] {
    const errs: FormError[] = [];
    const fe = this.formService.form.errors;

    if (fe?.['loanGtProperty']) {
      errs.push({
        section: FormErrorSection.BASIC_DATA,
        message: 'Kwota kredytu nie może być większa niż wartość nieruchomości.',
        fieldLabel: 'Kwota kredytu',
        fieldId: 'loanAmount',
      });
    }
    if (fe?.['totalMonthsInvalid']) {
      errs.push({
        section: FormErrorSection.BASIC_DATA,
        message: 'Łączna liczba miesięcy musi być większa od 0.',
        fieldLabel: 'Okres kredytowania',
        fieldId: 'loanPeriod',
      });
    }
    if (fe?.['capitalBeforeStart']) {
      errs.push({
        section: FormErrorSection.BASIC_DATA,
        message: 'Początek spłat kapitału nie może być wcześniejszy niż data uruchomienia.',
        fieldLabel: 'Data początku spłaty kapitału',
        fieldId: 'capitalStartDate',
      });
    }

    const mismatch = fe?.['trancheSumMismatch'];
    if (mismatch) {
      const expected = (mismatch.expected as number).toLocaleString('pl-PL', {
        minimumFractionDigits: 2,
      });
      const diff = mismatch.diff as number;
      const diffStr =
        (diff > 0 ? '+' : '') + diff.toLocaleString('pl-PL', { minimumFractionDigits: 2 });
      errs.push({
        section: FormErrorSection.TRANCHES,
        message: 'Suma transz musi być równa kwocie kredytu.',
        detail: `Oczekiwano: ${expected} zł · Różnica: ${diffStr} zł`,
        fieldLabel: 'Suma transz',
        fieldId: 'trancheSum',
      });
    }

    const tranches = this.formService.tranchesArray;
    if (tranches.controls.some((c) => c.get('amount')?.invalid)) {
      errs.push({
        section: FormErrorSection.TRANCHES,
        message: 'Kwota każdej transzy musi być większa od zera.',
        fieldLabel: 'Kwota transzy',
        fieldId: 'trancheAmount',
      });
    }
    if (tranches.controls.some((c) => c.get('disbursementFee')?.errors?.['max'])) {
      errs.push({
        section: FormErrorSection.TRANCHES,
        message: 'Wysokość opłaty za uruchomienie transzy nie może być wyższa niż 1 000 zł.',
        fieldLabel: 'Opłata za uruchomienie',
        fieldId: 'disbursementFee',
      });
    }

    if (fe?.['prepaymentDateRangeInvalid']) {
      errs.push({
        section: FormErrorSection.PREPAYMENTS,
        message: 'W regule nadpłaty data „do" nie może być wcześniejsza niż data „od".',
        fieldLabel: 'Zakres dat nadpłaty',
        fieldId: 'prepaymentRule',
      });
    }
    if (fe?.['prepaymentAmountInvalid']) {
      errs.push({
        section: FormErrorSection.PREPAYMENTS,
        message: 'Kwota nadpłaty nie może być ujemna.',
        fieldLabel: 'Kwota nadpłaty',
        fieldId: 'prepaymentAmount',
      });
    }
    if (fe?.['targetInstallmentDateRangeInvalid']) {
      errs.push({
        section: FormErrorSection.PREPAYMENTS,
        message: 'W regule docelowej raty data „do" nie może być wcześniejsza niż data „od".',
        fieldLabel: 'Zakres dat docelowej raty',
        fieldId: 'rataDocelowaRegula',
      });
    }
    if (fe?.['targetInstallmentInvalid']) {
      errs.push({
        section: FormErrorSection.PREPAYMENTS,
        message: 'Docelowa rata nie może być ujemna.',
        fieldLabel: 'Docelowa rata',
        fieldId: 'targetRate',
      });
    }

    return errs;
  }
}
