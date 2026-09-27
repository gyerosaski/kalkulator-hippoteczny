import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import {
  BasicDataRawValue,
  RatePeriodsRawValue,
  CommissionCalcMethod,
  ComparisonOfferData,
  ComparisonParamCell,
  ComparisonParamGroup,
  ComparisonParamNumericRowOptions,
  ComparisonParamRow,
  FormErrorSection,
  IconSize,
  InsuranceCalcMethod,
  LifeInsuranceCalcMethod,
  MortgageFormRawValue,
  OverheadCostsRawValue,
  PrepaymentsRawValue,
  RateType,
  TranchesRawValue,
} from '../../../model';
import { monthsBetweenStr } from '../../../helpers/date.helper';
import { SwitchComponent } from '../../ui/switch/switch.component';
import { SectionComponent } from '../../ui/section/section.component';
import { IconSlotAComponent } from '../../icons/icon-slot-a/icon-slot-a.component';
import { IconSlotBComponent } from '../../icons/icon-slot-b/icon-slot-b.component';
import { FormatMonthPipe } from '../../../pipes/format-month/format-month.pipe';
import { FormatLoanPeriodPipe } from '../../../pipes/format-loan-period/format-loan-period.pipe';
import { InstallmentTypeLabelPipe } from '../../../pipes/installment-type-label/installment-type-label.pipe';
import { RateTypeLabelPipe } from '../../../pipes/rate-type-label/rate-type-label.pipe';
import { InsuranceFrequencyLabelPipe } from '../../../pipes/insurance-frequency-label/insurance-frequency-label.pipe';
import { InsuranceCalcMethodLabelPipe } from '../../../pipes/insurance-calc-method-label/insurance-calc-method-label.pipe';
import { LifeInsuranceCalcMethodLabelPipe } from '../../../pipes/life-insurance-calc-method-label/life-insurance-calc-method-label.pipe';
import { PrepaymentEffectLabelPipe } from '../../../pipes/prepayment-effect-label/prepayment-effect-label.pipe';

const WHOLE_AMOUNT_FORMATTER = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });
const PERCENT_FORMATTER = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const EMPTY_CELL_TEXT = '—';
const EQUAL_DELTA_TEXT = '=';
const NOT_EQUAL_DELTA_TEXT = '≠';
const NO_VALUE_TEXT = 'brak';

function formatWholeAmount(value: number): string {
  return WHOLE_AMOUNT_FORMATTER.format(value);
}

function formatPercent(value: number): string {
  return PERCENT_FORMATTER.format(value);
}

function sign(value: number): string {
  return value > 0 ? '+' : '−';
}

function polishPlural(
  count: number,
  singular: string,
  pluralFew: string,
  pluralMany: string,
): string {
  if (count === 1) return singular;
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    return pluralFew;
  }
  return pluralMany;
}

function monthsUnit(monthsCount: number): string {
  return polishPlural(monthsCount, 'm-c', 'm-ce', 'm-cy');
}

function formatAmountDelta(delta: number): string {
  return `${sign(delta)}${formatWholeAmount(Math.abs(delta))} zł`;
}

function formatPercentDelta(delta: number): string {
  return `${sign(delta)}${formatPercent(Math.abs(delta))}%`;
}

function formatMonthsDelta(delta: number): string {
  const absoluteMonths = Math.abs(delta);
  return `${sign(delta)}${absoluteMonths} ${monthsUnit(absoluteMonths)}`;
}

function formatCountDelta(delta: number): string {
  return `${sign(delta)}${Math.abs(delta)}`;
}

function formatItemCount(count: number): string {
  return `${count} ${polishPlural(count, 'pozycja', 'pozycje', 'pozycji')}`;
}

function monthIndexFromYm(ym: string | null | undefined): number | null {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return null;
  const [year, month] = ym.split('-').map((part) => parseInt(part, 10));
  return year * 12 + month;
}

function emptyCell(): ComparisonParamCell {
  return { value: null, text: null };
}

function amountCell(value: number | null): ComparisonParamCell {
  return { value, text: value === null ? null : `${formatWholeAmount(value)} zł` };
}

function percentCell(value: number | null): ComparisonParamCell {
  return { value, text: value === null ? null : `${formatPercent(value)}%` };
}

function countCell(value: number | null): ComparisonParamCell {
  return { value, text: value === null ? null : `${value}` };
}

/**
 * Wiersz liczbowy: delta `B − A` ze znakiem i kolorem; gdy jedna strona nie ma wartości
 * (sekcja wyłączona) — komórka `—` i delta `≠`; gdy obie — wiersz traktowany jako identyczny.
 */
function buildNumericParamRow(
  label: string,
  aCell: ComparisonParamCell,
  bCell: ComparisonParamCell,
  options: ComparisonParamNumericRowOptions,
): ComparisonParamRow {
  const aText = aCell.text ?? EMPTY_CELL_TEXT;
  const bText = bCell.text ?? EMPTY_CELL_TEXT;

  if (aCell.value === null || bCell.value === null) {
    const bothMissing = aCell.value === null && bCell.value === null;
    return {
      label,
      aText,
      bText,
      deltaText: bothMissing ? EQUAL_DELTA_TEXT : NOT_EQUAL_DELTA_TEXT,
      deltaClass: bothMissing ? 'delta--flat' : 'delta--up',
      aIsLeader: false,
      bIsLeader: false,
      isEqual: bothMissing,
    };
  }

  const delta = bCell.value - aCell.value;
  const isEqual = Math.abs(delta) < 1e-9;
  const lessIsBetter = options.lessIsBetter ?? false;

  return {
    label,
    aText,
    bText,
    deltaText: isEqual ? EQUAL_DELTA_TEXT : options.formatDelta(delta),
    deltaClass: isEqual ? 'delta--flat' : delta > 0 ? 'delta--up' : 'delta--down',
    aIsLeader: !isEqual && lessIsBetter && aCell.value < bCell.value,
    bIsLeader: !isEqual && lessIsBetter && bCell.value < aCell.value,
    isEqual,
  };
}

/** Wiersz wyboru tekstowego: delta `≠` w kolorze ostrzegawczym lub `=`; `null` = sekcja wyłączona (`—`). */
function buildChoiceParamRow(
  label: string,
  aText: string | null,
  bText: string | null,
): ComparisonParamRow {
  const isEqual = aText === bText;
  return {
    label,
    aText: aText ?? EMPTY_CELL_TEXT,
    bText: bText ?? EMPTY_CELL_TEXT,
    deltaText: isEqual ? EQUAL_DELTA_TEXT : NOT_EQUAL_DELTA_TEXT,
    deltaClass: isEqual ? 'delta--flat' : 'delta--up',
    aIsLeader: false,
    bIsLeader: false,
    isEqual,
  };
}

/** Wiersz listy złożonej: komórki z liczbą pozycji, delta `≠/=` po porównaniu znormalizowanej zawartości. */
function buildComplexListParamRow(
  label: string,
  aItems: readonly unknown[] | null,
  bItems: readonly unknown[] | null,
): ComparisonParamRow {
  const isEqual = JSON.stringify(aItems) === JSON.stringify(bItems);
  return {
    label,
    aText: aItems === null ? EMPTY_CELL_TEXT : formatItemCount(aItems.length),
    bText: bItems === null ? EMPTY_CELL_TEXT : formatItemCount(bItems.length),
    deltaText: isEqual ? EQUAL_DELTA_TEXT : NOT_EQUAL_DELTA_TEXT,
    deltaClass: isEqual ? 'delta--flat' : 'delta--up',
    aIsLeader: false,
    bIsLeader: false,
    isEqual,
  };
}

@Component({
  selector: 'app-comparison-params-table',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SwitchComponent,
    SectionComponent,
    IconSlotAComponent,
    IconSlotBComponent,
  ],
  providers: [
    FormatMonthPipe,
    FormatLoanPeriodPipe,
    InstallmentTypeLabelPipe,
    RateTypeLabelPipe,
    InsuranceFrequencyLabelPipe,
    InsuranceCalcMethodLabelPipe,
    LifeInsuranceCalcMethodLabelPipe,
    PrepaymentEffectLabelPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './comparison-params-table.component.html',
  styleUrl: './comparison-params-table.component.scss',
})
export class ComparisonParamsTableComponent {
  private readonly formatMonth = inject(FormatMonthPipe);
  private readonly formatLoanPeriod = inject(FormatLoanPeriodPipe);
  private readonly installmentTypeLabel = inject(InstallmentTypeLabelPipe);
  private readonly rateTypeLabel = inject(RateTypeLabelPipe);
  private readonly insuranceFrequencyLabel = inject(InsuranceFrequencyLabelPipe);
  private readonly insuranceCalcMethodLabel = inject(InsuranceCalcMethodLabelPipe);
  private readonly lifeInsuranceCalcMethodLabel = inject(LifeInsuranceCalcMethodLabelPipe);
  private readonly prepaymentEffectLabel = inject(PrepaymentEffectLabelPipe);

  readonly sideA = input.required<ComparisonOfferData>();
  readonly sideB = input.required<ComparisonOfferData>();

  protected readonly IconSize = IconSize;

  protected readonly onlyDifferencesControl = new FormControl<boolean>(false, {
    nonNullable: true,
  });

  private readonly onlyDifferences = toSignal(this.onlyDifferencesControl.valueChanges, {
    initialValue: this.onlyDifferencesControl.value,
  });

  protected readonly offerName = computed(() => ({
    a: this.sideA().offer.name,
    b: this.sideB().offer.name,
  }));

  private readonly allGroups = computed<ComparisonParamGroup[]>(() => {
    const formValueA = this.sideA().formValue;
    const formValueB = this.sideB().formValue;
    return [
      {
        name: FormErrorSection.BASIC_DATA,
        rows: this.buildBasicDataRows(formValueA, formValueB),
      },
      {
        name: FormErrorSection.OVERHEAD_COSTS,
        rows: this.buildOverheadCostsRows(formValueA, formValueB),
      },
      {
        name: FormErrorSection.TRANCHES,
        rows: this.buildTranchesRows(formValueA, formValueB),
      },
      {
        name: FormErrorSection.PREPAYMENTS,
        rows: this.buildPrepaymentsRows(formValueA, formValueB),
      },
    ];
  });

  protected readonly visibleGroups = computed<ComparisonParamGroup[]>(() => {
    const groups = this.allGroups();
    if (!this.onlyDifferences()) return groups;
    return groups
      .map((group) => ({ ...group, rows: group.rows.filter((row) => !row.isEqual) }))
      .filter((group) => group.rows.length > 0);
  });

  /* ---------- Dane podstawowe ---------- */

  private buildBasicDataRows(
    formValueA: MortgageFormRawValue | null,
    formValueB: MortgageFormRawValue | null,
  ): ComparisonParamRow[] {
    const basicA = formValueA?.basicData ?? null;
    const basicB = formValueB?.basicData ?? null;
    const ratePeriodsA = formValueA?.ratePeriods.items ?? null;
    const ratePeriodsB = formValueB?.ratePeriods.items ?? null;

    return [
      buildNumericParamRow(
        'Wartość nieruchomości',
        amountCell(basicA?.propertyValue ?? null),
        amountCell(basicB?.propertyValue ?? null),
        { formatDelta: formatAmountDelta },
      ),
      buildNumericParamRow(
        'Kwota kredytu',
        amountCell(basicA?.loanAmount ?? null),
        amountCell(basicB?.loanAmount ?? null),
        { formatDelta: formatAmountDelta },
      ),
      buildNumericParamRow(
        'LTV',
        percentCell(basicA?.ltv ?? null),
        percentCell(basicB?.ltv ?? null),
        {
          formatDelta: formatPercentDelta,
        },
      ),
      buildNumericParamRow(
        'Okres kredytowania',
        this.loanPeriodCell(basicA),
        this.loanPeriodCell(basicB),
        { formatDelta: formatMonthsDelta },
      ),
      buildNumericParamRow(
        'Data uruchomienia',
        this.dateCell(basicA?.startDate ?? null),
        this.dateCell(basicB?.startDate ?? null),
        { formatDelta: formatMonthsDelta },
      ),
      buildNumericParamRow(
        'Początek spłat kapitału (karencja)',
        this.gracePeriodCell(basicA),
        this.gracePeriodCell(basicB),
        { formatDelta: formatMonthsDelta },
      ),
      buildChoiceParamRow(
        'Tryb rat',
        basicA ? this.installmentTypeLabel.transform(basicA.installmentType) : null,
        basicB ? this.installmentTypeLabel.transform(basicB.installmentType) : null,
      ),
      buildChoiceParamRow(
        'Rodzaj stopy',
        this.initialRateTypeText(ratePeriodsA),
        this.initialRateTypeText(ratePeriodsB),
      ),
      buildNumericParamRow(
        'Oprocentowanie nominalne (start)',
        percentCell(this.initialNominalRate(ratePeriodsA)),
        percentCell(this.initialNominalRate(ratePeriodsB)),
        { formatDelta: formatPercentDelta, lessIsBetter: true },
      ),
      buildChoiceParamRow(
        'Wskaźnik referencyjny / marża',
        this.referenceIndexMarginText(ratePeriodsA),
        this.referenceIndexMarginText(ratePeriodsB),
      ),
      buildNumericParamRow(
        'Liczba okresów oprocentowania',
        countCell(ratePeriodsA?.length ?? null),
        countCell(ratePeriodsB?.length ?? null),
        { formatDelta: formatCountDelta },
      ),
    ];
  }

  private loanPeriodCell(basicData: BasicDataRawValue | null): ComparisonParamCell {
    if (!basicData) return emptyCell();
    const loanPeriodMonths = Number(basicData.loanPeriod) || 0;
    const periodText = this.formatLoanPeriod.transform(
      Math.floor(loanPeriodMonths / 12),
      loanPeriodMonths % 12,
    );
    return { value: loanPeriodMonths, text: `${periodText} (${loanPeriodMonths} mies.)` };
  }

  private dateCell(ym: string | null): ComparisonParamCell {
    const monthIndex = monthIndexFromYm(ym);
    return { value: monthIndex, text: monthIndex === null ? null : this.formatMonth.transform(ym) };
  }

  /** Długość karencji liczona jak w silniku: `monthsBetween(start, startKapitału) − 1`; `0` = bez karencji. */
  private gracePeriodCell(basicData: BasicDataRawValue | null): ComparisonParamCell {
    if (!basicData?.startDate || !basicData.capitalStartDate) return emptyCell();
    const graceMonths = Math.max(
      0,
      monthsBetweenStr(basicData.startDate, basicData.capitalStartDate) - 1,
    );
    return {
      value: graceMonths,
      text:
        graceMonths === 0
          ? 'bez karencji'
          : `${this.formatMonth.transform(basicData.capitalStartDate)} (${graceMonths} ${monthsUnit(graceMonths)})`,
    };
  }

  private initialRateTypeText(ratePeriods: RatePeriodsRawValue['items'] | null): string | null {
    const firstRatePeriod = ratePeriods?.[0];
    if (!firstRatePeriod) return null;
    return this.rateTypeLabel.transform(firstRatePeriod.rateType);
  }

  private initialNominalRate(ratePeriods: RatePeriodsRawValue['items'] | null): number | null {
    const firstRatePeriod = ratePeriods?.[0];
    if (!firstRatePeriod) return null;
    return firstRatePeriod.rateType === RateType.VARIABLE
      ? (Number(firstRatePeriod.referenceIndex) || 0) + (Number(firstRatePeriod.margin) || 0)
      : Number(firstRatePeriod.nominalRate) || 0;
  }

  private referenceIndexMarginText(
    ratePeriods: RatePeriodsRawValue['items'] | null,
  ): string | null {
    const firstRatePeriod = ratePeriods?.[0];
    if (!firstRatePeriod) return null;
    if (firstRatePeriod.rateType !== RateType.VARIABLE) return NO_VALUE_TEXT;
    const referenceIndex = Number(firstRatePeriod.referenceIndex) || 0;
    const margin = Number(firstRatePeriod.margin) || 0;
    return `${formatPercent(referenceIndex)}% + ${formatPercent(margin)}%`;
  }

  /* ---------- Koszty okołokredytowe i promocje ---------- */

  private buildOverheadCostsRows(
    formValueA: MortgageFormRawValue | null,
    formValueB: MortgageFormRawValue | null,
  ): ComparisonParamRow[] {
    const costsA = formValueA?.overheadCosts.enabled ? formValueA.overheadCosts.fields : null;
    const costsB = formValueB?.overheadCosts.enabled ? formValueB.overheadCosts.fields : null;
    const loanAmountA = formValueA?.basicData.loanAmount ?? 0;
    const loanAmountB = formValueB?.basicData.loanAmount ?? 0;

    return [
      buildNumericParamRow(
        'Prowizja za udzielenie',
        this.commissionCell(costsA, loanAmountA),
        this.commissionCell(costsB, loanAmountB),
        { formatDelta: formatAmountDelta, lessIsBetter: true },
      ),
      buildNumericParamRow(
        'Opłata za wycenę',
        amountCell(costsA ? Number(costsA.appraisal.appraisalFee) || 0 : null),
        amountCell(costsB ? Number(costsB.appraisal.appraisalFee) || 0 : null),
        { formatDelta: formatAmountDelta, lessIsBetter: true },
      ),
      buildChoiceParamRow(
        'Ubezpieczenie pomostowe',
        this.bridgeText(costsA),
        this.bridgeText(costsB),
      ),
      buildChoiceParamRow(
        'Ubezp. nieruchomości',
        this.propertyInsuranceText(costsA),
        this.propertyInsuranceText(costsB),
      ),
      buildNumericParamRow(
        'Ubezp. niskiego wkładu',
        this.lowEquityCell(costsA),
        this.lowEquityCell(costsB),
        { formatDelta: formatPercentDelta, lessIsBetter: true },
      ),
      buildChoiceParamRow(
        'Ubezp. na życie',
        this.lifeInsuranceText(costsA),
        this.lifeInsuranceText(costsB),
      ),
      buildChoiceParamRow(
        'Ubezp. od utraty pracy',
        this.jobLossInsuranceText(costsA),
        this.jobLossInsuranceText(costsB),
      ),
      buildComplexListParamRow(
        'Dodatkowe koszty',
        costsA ? costsA.additionalCosts.items : null,
        costsB ? costsB.additionalCosts.items : null,
      ),
      buildChoiceParamRow(
        'Promocyjna obniżka oprocentowania',
        this.promoRateText(costsA),
        this.promoRateText(costsB),
      ),
    ];
  }

  private commissionCell(
    costs: OverheadCostsRawValue | null,
    loanAmount: number,
  ): ComparisonParamCell {
    if (!costs) return emptyCell();
    const commissionValue = Number(costs.commission.commissionValue) || 0;
    if (costs.commission.commissionCalcMethod === CommissionCalcMethod.PERCENTAGE) {
      const commissionAmount = (loanAmount * commissionValue) / 100;
      return {
        value: commissionAmount,
        text: `${formatPercent(commissionValue)}% (= ${formatWholeAmount(commissionAmount)} zł)`,
      };
    }
    return { value: commissionValue, text: `${formatWholeAmount(commissionValue)} zł` };
  }

  private bridgeText(costs: OverheadCostsRawValue | null): string | null {
    if (!costs) return null;
    const rateIncrease = Number(costs.bridge.bridgeRateIncrease) || 0;
    const bridgeMonths = Number(costs.bridge.bridgeMonths) || 0;
    if (rateIncrease <= 0 || bridgeMonths <= 0) return NO_VALUE_TEXT;
    return `+${formatPercent(rateIncrease)}% przez ${bridgeMonths} ${monthsUnit(bridgeMonths)}`;
  }

  private propertyInsuranceText(costs: OverheadCostsRawValue | null): string | null {
    if (!costs) return null;
    const insurance = costs.propertyInsurance;
    const insuranceValue = Number(insurance.propInsValue) || 0;
    if (insuranceValue <= 0) return NO_VALUE_TEXT;
    const valueText =
      insurance.propInsCalcMethod === InsuranceCalcMethod.FIXED_AMOUNT
        ? `${formatWholeAmount(insuranceValue)} zł`
        : `${formatPercent(insuranceValue)}%`;
    return `${this.insuranceFrequencyLabel.transform(insurance.propInsFrequency)} · ${this.insuranceCalcMethodLabel.transform(insurance.propInsCalcMethod)} · ${valueText}`;
  }

  private lowEquityCell(costs: OverheadCostsRawValue | null): ComparisonParamCell {
    if (!costs) return emptyCell();
    const rateIncrease = Number(costs.lowEquityInsurance.lowEquityRateIncrease) || 0;
    return {
      value: rateIncrease,
      text: rateIncrease > 0 ? `+${formatPercent(rateIncrease)}%` : NO_VALUE_TEXT,
    };
  }

  private lifeInsuranceText(costs: OverheadCostsRawValue | null): string | null {
    if (!costs) return null;
    const insurance = costs.lifeInsurance;
    const insuranceValue = Number(insurance.lifeInsValue) || 0;
    if (insuranceValue <= 0) return NO_VALUE_TEXT;
    const valueText =
      insurance.lifeInsCalcMethod === LifeInsuranceCalcMethod.FIXED_AMOUNT
        ? `${formatWholeAmount(insuranceValue)} zł`
        : `${formatPercent(insuranceValue)}%`;
    return `${this.insuranceFrequencyLabel.transform(insurance.lifeInsFrequency)} · ${this.lifeInsuranceCalcMethodLabel.transform(insurance.lifeInsCalcMethod)} · ${valueText}`;
  }

  private jobLossInsuranceText(costs: OverheadCostsRawValue | null): string | null {
    if (!costs) return null;
    const insurance = costs.jobLossInsurance;
    const insuranceValue = Number(insurance.jobLossInsValue) || 0;
    if (insuranceValue <= 0) return NO_VALUE_TEXT;
    const valueText =
      insurance.jobLossInsCalcMethod === LifeInsuranceCalcMethod.FIXED_AMOUNT
        ? `${formatWholeAmount(insuranceValue)} zł`
        : `${formatPercent(insuranceValue)}%`;
    return `${this.insuranceFrequencyLabel.transform(insurance.jobLossInsFrequency)} · ${this.lifeInsuranceCalcMethodLabel.transform(insurance.jobLossInsCalcMethod)} · ${valueText}`;
  }

  private promoRateText(costs: OverheadCostsRawValue | null): string | null {
    if (!costs) return null;
    const rateDecrease = Number(costs.promoRate.promoRateDecrease) || 0;
    if (rateDecrease <= 0) return NO_VALUE_TEXT;
    return `−${formatPercent(rateDecrease)}% · ${this.formatMonth.transform(costs.promoRate.promoFrom)} → ${this.formatMonth.transform(costs.promoRate.promoTo)}`;
  }

  /* ---------- Transze ---------- */

  private buildTranchesRows(
    formValueA: MortgageFormRawValue | null,
    formValueB: MortgageFormRawValue | null,
  ): ComparisonParamRow[] {
    const tranchesA = formValueA?.tranches.enabled ? formValueA.tranches.fields.tranches : null;
    const tranchesB = formValueB?.tranches.enabled ? formValueB.tranches.fields.tranches : null;

    return [
      buildNumericParamRow(
        'Liczba transz',
        countCell(tranchesA?.length ?? null),
        countCell(tranchesB?.length ?? null),
        { formatDelta: formatCountDelta },
      ),
      buildNumericParamRow(
        'Suma opłat za uruchomienie',
        amountCell(this.disbursementFeesTotal(tranchesA)),
        amountCell(this.disbursementFeesTotal(tranchesB)),
        { formatDelta: formatAmountDelta, lessIsBetter: true },
      ),
    ];
  }

  private disbursementFeesTotal(tranches: TranchesRawValue['tranches'] | null): number | null {
    if (tranches === null) return null;
    return tranches.reduce((sum, tranche) => sum + (Number(tranche.disbursementFee) || 0), 0);
  }

  /* ---------- Nadpłaty ---------- */

  private buildPrepaymentsRows(
    formValueA: MortgageFormRawValue | null,
    formValueB: MortgageFormRawValue | null,
  ): ComparisonParamRow[] {
    const prepaymentsA = formValueA?.prepayments.enabled ? formValueA.prepayments.fields : null;
    const prepaymentsB = formValueB?.prepayments.enabled ? formValueB.prepayments.fields : null;

    return [
      buildComplexListParamRow(
        'Reguły nadpłat',
        prepaymentsA ? prepaymentsA.prepaymentRules.items : null,
        prepaymentsB ? prepaymentsB.prepaymentRules.items : null,
      ),
      buildChoiceParamRow(
        'Docelowa rata miesięczna',
        this.targetInstallmentText(prepaymentsA),
        this.targetInstallmentText(prepaymentsB),
      ),
      buildChoiceParamRow(
        'Prowizja za wcześniejszą spłatę',
        this.earlyRepaymentCommissionText(prepaymentsA),
        this.earlyRepaymentCommissionText(prepaymentsB),
      ),
    ];
  }

  private targetInstallmentText(prepayments: PrepaymentsRawValue | null): string | null {
    if (!prepayments) return null;
    const rule = prepayments.rataDocelowaRegula;
    const targetRate = Number(rule.targetRate) || 0;
    if (targetRate <= 0) return NO_VALUE_TEXT;
    return `${formatWholeAmount(targetRate)} zł · ${this.prepaymentEffectLabel.transform(rule.effect)} · ${this.formatMonth.transform(rule.from)} → ${this.formatMonth.transform(rule.to)}`;
  }

  private earlyRepaymentCommissionText(prepayments: PrepaymentsRawValue | null): string | null {
    if (!prepayments) return null;
    const commission = prepayments.prowizjaWczesniejszaSplata;
    const commissionRate = Number(commission.ratePct) || 0;
    if (commissionRate <= 0) return NO_VALUE_TEXT;
    return `${formatPercent(commissionRate)}% do ${this.formatMonth.transform(commission.validUntil)}`;
  }
}
