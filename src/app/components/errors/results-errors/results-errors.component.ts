import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormService } from '../../../services/form/form';
import {
  CapitalAfterLoanEndErrorDetails,
  CapitalBeforeLastTrancheErrorDetails,
  FormError,
  FormErrorSection,
  ItemPositionsErrorDetails,
  OverheadCostDatesErrorDetails,
  OverheadCostKind,
  TrancheSumMismatchErrorDetails,
} from '../../../model';
import { FormatMonthPipe } from '../../../pipes/format-month/format-month.pipe';
import { OverheadCostKindLabelPipe } from '../../../pipes/overhead-cost-kind-label/overhead-cost-kind-label.pipe';
import { IconWarningComponent } from '../../icons/icon-warning/icon-warning.component';
import { IconWarningSmComponent } from '../../icons/icon-warning-sm/icon-warning-sm.component';
import { BadgeComponent } from '../../ui/badge/badge.component';
import { BadgeVariant } from '../../../model';

/** Lista numerów pozycji w komunikacie, np. „nr 2, 3”. */
function positionsLabel(positions: number[]): string {
  return `nr ${positions.join(', ')}`;
}

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
  imports: [IconWarningComponent, IconWarningSmComponent, BadgeComponent],
  templateUrl: './results-errors.component.html',
  styleUrl: './results-errors.component.scss',
})
export class ResultsErrorsComponent {
  private readonly formService = inject(FormService);
  private readonly formatMonthPipe = new FormatMonthPipe();
  private readonly overheadCostKindLabelPipe = new OverheadCostKindLabelPipe();
  protected readonly BadgeVariant = BadgeVariant;

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
      FormErrorSection.RATE_PERIODS,
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
    const capitalBeforeLastTranche = fe?.['capitalBeforeLastTranche'] as
      | CapitalBeforeLastTrancheErrorDetails
      | undefined;
    if (capitalBeforeLastTranche) {
      errs.push({
        section: FormErrorSection.BASIC_DATA,
        message: `Początek spłat kapitału musi przypadać po dacie uruchomienia ostatniej transzy (ostatnia transza: ${this.formatMonthPipe.transform(capitalBeforeLastTranche.lastTrancheDate)}).`,
        fieldLabel: 'Data początku spłaty kapitału',
        fieldId: 'capitalStartDate',
      });
    }
    const capitalAfterLoanEnd = fe?.['capitalAfterLoanEnd'] as
      | CapitalAfterLoanEndErrorDetails
      | undefined;
    if (capitalAfterLoanEnd) {
      errs.push({
        section: FormErrorSection.BASIC_DATA,
        message: `Początek spłat kapitału nie może przypadać po ostatniej racie kredytu (${this.formatMonthPipe.transform(capitalAfterLoanEnd.loanEndDate)}) — okres karencji musi być krótszy niż okres kredytowania.`,
        fieldLabel: 'Data początku spłaty kapitału',
        fieldId: 'capitalStartDate',
      });
    }

    const ratePeriodsOutsideLoan = fe?.['ratePeriodOutsideLoan'] as
      | ItemPositionsErrorDetails
      | undefined;
    if (ratePeriodsOutsideLoan) {
      errs.push({
        section: FormErrorSection.RATE_PERIODS,
        message: `Okres oprocentowania ${positionsLabel(ratePeriodsOutsideLoan.positions)} musi zaczynać się po dacie uruchomienia kredytu i nie później niż w miesiącu ostatniej raty.`,
        fieldLabel: 'Data początku okresu',
        fieldId: 'ratePeriodFrom',
      });
    }
    const ratePeriodDuplicateDates = fe?.['ratePeriodDuplicateDates'] as
      | ItemPositionsErrorDetails
      | undefined;
    if (ratePeriodDuplicateDates) {
      errs.push({
        section: FormErrorSection.RATE_PERIODS,
        message: `Okresy oprocentowania ${positionsLabel(ratePeriodDuplicateDates.positions)} zaczynają się w tym samym miesiącu — każdy okres musi mieć inną datę początku.`,
        fieldLabel: 'Data początku okresu',
        fieldId: 'ratePeriodFrom',
      });
    }

    const mismatch = fe?.['trancheSumMismatch'] as TrancheSumMismatchErrorDetails | undefined;
    if (mismatch) {
      const expected = mismatch.expected.toLocaleString('pl-PL', {
        minimumFractionDigits: 2,
      });
      const diff = mismatch.diff;
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
    if (
      this.formService.isTranchesEnabled &&
      tranches.controls.some((c) => c.get('amount')?.invalid)
    ) {
      errs.push({
        section: FormErrorSection.TRANCHES,
        message: 'Kwota każdej transzy musi być większa od zera.',
        fieldLabel: 'Kwota transzy',
        fieldId: 'trancheAmount',
      });
    }
    if (
      this.formService.isTranchesEnabled &&
      tranches.controls.some((c) => c.get('disbursementFee')?.errors?.['max'])
    ) {
      errs.push({
        section: FormErrorSection.TRANCHES,
        message: 'Wysokość opłaty za uruchomienie transzy nie może być wyższa niż 1 000 zł.',
        fieldLabel: 'Opłata za uruchomienie',
        fieldId: 'disbursementFee',
      });
    }

    const tranchesNotAfterStart = fe?.['trancheDateNotAfterStart'] as
      | ItemPositionsErrorDetails
      | undefined;
    if (tranchesNotAfterStart) {
      errs.push({
        section: FormErrorSection.TRANCHES,
        message: `Transza ${positionsLabel(tranchesNotAfterStart.positions)} musi zostać uruchomiona po dacie uruchomienia kredytu — w tym samym miesiącu uruchamiana jest tylko pierwsza transza.`,
        fieldLabel: 'Data uruchomienia transzy',
        fieldId: 'trancheDate',
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
    const prepaymentsOutsideLoan = fe?.['prepaymentOutsideLoan'] as
      | ItemPositionsErrorDetails
      | undefined;
    if (prepaymentsOutsideLoan) {
      errs.push({
        section: FormErrorSection.PREPAYMENTS,
        message: `Nadpłata ${positionsLabel(prepaymentsOutsideLoan.positions)} musi zaczynać się między miesiącem pierwszej a miesiącem ostatniej raty kredytu.`,
        fieldLabel: 'Data nadpłaty',
        fieldId: 'prepaymentRule',
      });
    }
    if (fe?.['targetInstallmentOutsideLoan']) {
      errs.push({
        section: FormErrorSection.PREPAYMENTS,
        message:
          'Reguła docelowej raty musi zaczynać się między miesiącem pierwszej a miesiącem ostatniej raty kredytu.',
        fieldLabel: 'Data docelowej raty',
        fieldId: 'targetInstallment',
      });
    }
    if (fe?.['targetInstallmentDateRangeInvalid']) {
      errs.push({
        section: FormErrorSection.PREPAYMENTS,
        message: 'W regule docelowej raty data „do" nie może być wcześniejsza niż data „od".',
        fieldLabel: 'Zakres dat docelowej raty',
        fieldId: 'targetInstallment',
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

    if (fe?.['commissionPctOverMax']) {
      errs.push({
        section: FormErrorSection.OVERHEAD_COSTS,
        message: 'Prowizja za udzielenie (%) nie może przekraczać 100%.',
        fieldLabel: 'Prowizja',
        fieldId: 'commission-value',
        fieldNum: '1a',
      });
    }

    const overheadCostsOutsideLoan = fe?.['overheadCostOutsideLoan'] as
      | OverheadCostDatesErrorDetails
      | undefined;
    if (overheadCostsOutsideLoan) {
      errs.push({
        section: FormErrorSection.OVERHEAD_COSTS,
        message: `${this.overheadCostsLabel(overheadCostsOutsideLoan.kinds)}: data „od” musi przypadać między miesiącem pierwszej a miesiącem ostatniej raty kredytu.`,
        fieldLabel: 'Data naliczania kosztu',
        fieldId: 'overheadCostDates',
      });
    }
    const overheadCostsWithInvalidRange = fe?.['overheadCostDateRangeInvalid'] as
      | OverheadCostDatesErrorDetails
      | undefined;
    if (overheadCostsWithInvalidRange) {
      errs.push({
        section: FormErrorSection.OVERHEAD_COSTS,
        message: `${this.overheadCostsLabel(overheadCostsWithInvalidRange.kinds)}: data „do” nie może być wcześniejsza niż data „od”.`,
        fieldLabel: 'Zakres dat kosztu',
        fieldId: 'overheadCostDates',
      });
    }
    if (fe?.['promotionalRateOutsideLoan']) {
      errs.push({
        section: FormErrorSection.OVERHEAD_COSTS,
        message:
          'Promocja oprocentowania musi zaczynać się między miesiącem pierwszej a miesiącem ostatniej raty kredytu.',
        fieldLabel: 'Promocja oprocentowania',
        fieldId: 'promoRate',
      });
    }
    if (fe?.['promotionalRateDateRangeInvalid']) {
      errs.push({
        section: FormErrorSection.OVERHEAD_COSTS,
        message: 'W promocji oprocentowania data „do” nie może być wcześniejsza niż data „od”.',
        fieldLabel: 'Promocja oprocentowania',
        fieldId: 'promoRate',
      });
    }

    return errs;
  }

  /** Etykiety rodzajów kosztów rozdzielone przecinkami, np. „Ubezpieczenie na życie, Koszt dodatkowy”. */
  private overheadCostsLabel(kinds: OverheadCostKind[]): string {
    return kinds
      .map((kind) => this.overheadCostKindLabelPipe.transform({ kind, value: 0 }))
      .join(', ');
  }
}
