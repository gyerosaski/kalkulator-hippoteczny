import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  CommissionCalcMethod,
  InsuranceCalcMethod,
  InsuranceFrequency,
  LifeInsuranceCalcMethod,
} from '../../../model';
import { FormService } from '../../../services/form/form';
import { InsuranceFrequencyLabelPipe } from '../../../pipes/insurance-frequency-label/insurance-frequency-label.pipe';
import { InsuranceCalcMethodLabelPipe } from '../../../pipes/insurance-calc-method-label/insurance-calc-method-label.pipe';
import { LifeInsuranceCalcMethodLabelPipe } from '../../../pipes/life-insurance-calc-method-label/life-insurance-calc-method-label.pipe';
import { CommissionCalcMethodLabelPipe } from '../../../pipes/commission-calc-method-label/commission-calc-method-label.pipe';
import { SectionComponent } from '../../ui/section/section.component';
import { ColorCodeArea } from '../../../model';
import { FieldComponent } from '../../ui/field/field.component';
import { NumberInputComponent } from '../../ui/number-input/number-input.component';
import { MonthPickerComponent } from '../../ui/month-picker/month-picker.component';
import { SelectComponent } from '../../ui/select/select.component';
import { BtnAddComponent } from '../../ui/btn-add/btn-add.component';
import { CardComponent } from '../../ui/card/card.component';
import { SubsectionComponent } from '../../ui/subsection/subsection.component';
import { DividerComponent } from '../../ui/divider/divider.component';
import { SegmentedComponent } from '../../ui/segmented/segmented.component';

@Component({
  selector: 'app-overhead-costs-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SectionComponent,
    FieldComponent,
    NumberInputComponent,
    MonthPickerComponent,
    SelectComponent,
    BtnAddComponent,
    CardComponent,
    SubsectionComponent,
    DividerComponent,
    InsuranceFrequencyLabelPipe,
    InsuranceCalcMethodLabelPipe,
    LifeInsuranceCalcMethodLabelPipe,
    CommissionCalcMethodLabelPipe,
    SegmentedComponent,
  ],
  templateUrl: './overhead-costs-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverheadCostsFormComponent {
  protected readonly colorCodeArea = ColorCodeArea;
  protected readonly InsuranceFrequency = InsuranceFrequency;

  private formService = inject(FormService);

  constructor() {
    this.commissionCalcMethodControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        this.convertCommissionValue();
      });
  }

  readonly commissionCalcMethodOptions = Object.values(CommissionCalcMethod);
  readonly insuranceFrequencyOptions = Object.values(InsuranceFrequency);
  readonly propertyInsFrequencyOptions = [InsuranceFrequency.YEARLY, InsuranceFrequency.MONTHLY];
  readonly propertyInsCalcOptions = Object.values(InsuranceCalcMethod);
  readonly lifeInsCalcOptions = Object.values(LifeInsuranceCalcMethod);

  readonly lifeInsFrequency = toSignal(
    this.form.controls.lifeInsurance.controls.lifeInsFrequency.valueChanges,
    { initialValue: this.form.controls.lifeInsurance.controls.lifeInsFrequency.value },
  );

  readonly jobLossInsFrequency = toSignal(
    this.form.controls.jobLossInsurance.controls.jobLossInsFrequency.valueChanges,
    { initialValue: this.form.controls.jobLossInsurance.controls.jobLossInsFrequency.value },
  );

  readonly additionalCostFrequencies = toSignal(
    this.form.controls.additionalCosts.controls.items.valueChanges.pipe(
      map(() =>
        this.form.controls.additionalCosts.controls.items.controls.map(
          (control) => control.controls.frequency.value,
        ),
      ),
    ),
    {
      initialValue: this.form.controls.additionalCosts.controls.items.controls.map(
        (control) => control.controls.frequency.value,
      ),
    },
  );

  get section() {
    return this.formService.overheadCostsSection;
  }

  get expandedControl() {
    return this.section.controls.expanded;
  }

  get sectionEnabledControl() {
    return this.section.controls.enabled;
  }

  readonly isSectionEnabled = toSignal(
    this.formService.overheadCostsSection.controls.enabled.valueChanges,
    { initialValue: this.formService.overheadCostsSection.controls.enabled.value },
  );

  get form() {
    return this.formService.overheadCostsGroup;
  }

  get additionalCostsArray() {
    return this.formService.additionalCostsArray;
  }

  // commission
  get commissionValueControl() {
    return this.form.controls.commission.controls.commissionValue;
  }

  get commissionCalcMethodControl() {
    return this.form.controls.commission.controls.commissionCalcMethod;
  }

  get commissionSuffix(): string {
    return this.form.controls.commission.controls.commissionCalcMethod.value ===
      CommissionCalcMethod.FIXED_AMOUNT
      ? 'zł'
      : '%';
  }

  get commissionDecimals(): number {
    return this.form.controls.commission.controls.commissionCalcMethod.value ===
      CommissionCalcMethod.FIXED_AMOUNT
      ? 2
      : 4;
  }

  // appraisal
  get appraisalFeeControl() {
    return this.form.controls.appraisal.controls.appraisalFee;
  }

  // bridge
  get bridgeRateIncreaseControl() {
    return this.form.controls.bridge.controls.bridgeRateIncrease;
  }

  get bridgeMonthsControl() {
    return this.form.controls.bridge.controls.bridgeMonths;
  }

  // propertyInsurance
  get propInsFrequencyControl() {
    return this.form.controls.propertyInsurance.controls.propInsFrequency;
  }

  get propInsCalcMethodControl() {
    return this.form.controls.propertyInsurance.controls.propInsCalcMethod;
  }

  get propInsValueControl() {
    return this.form.controls.propertyInsurance.controls.propInsValue;
  }

  get propInsFromControl() {
    return this.form.controls.propertyInsurance.controls.propInsFrom;
  }

  get propInsToControl() {
    return this.form.controls.propertyInsurance.controls.propInsTo;
  }

  // lowEquityInsurance
  get lowEquityRateIncreaseControl() {
    return this.form.controls.lowEquityInsurance.controls.lowEquityRateIncrease;
  }

  // lifeInsurance
  get lifeInsFrequencyControl() {
    return this.form.controls.lifeInsurance.controls.lifeInsFrequency;
  }

  get lifeInsCalcMethodControl() {
    return this.form.controls.lifeInsurance.controls.lifeInsCalcMethod;
  }

  get lifeInsValueControl() {
    return this.form.controls.lifeInsurance.controls.lifeInsValue;
  }

  get lifeInsFromControl() {
    return this.form.controls.lifeInsurance.controls.lifeInsFrom;
  }

  get lifeInsToControl() {
    return this.form.controls.lifeInsurance.controls.lifeInsTo;
  }

  // jobLossInsurance
  get jobLossInsFrequencyControl() {
    return this.form.controls.jobLossInsurance.controls.jobLossInsFrequency;
  }

  get jobLossInsCalcMethodControl() {
    return this.form.controls.jobLossInsurance.controls.jobLossInsCalcMethod;
  }

  get jobLossInsValueControl() {
    return this.form.controls.jobLossInsurance.controls.jobLossInsValue;
  }

  get jobLossInsFromControl() {
    return this.form.controls.jobLossInsurance.controls.jobLossInsFrom;
  }

  get jobLossInsToControl() {
    return this.form.controls.jobLossInsurance.controls.jobLossInsTo;
  }

  // promoRate
  get promoRateDecreaseControl() {
    return this.form.controls.promoRate.controls.promoRateDecrease;
  }

  get promoFromControl() {
    return this.form.controls.promoRate.controls.promoFrom;
  }

  get promoToControl() {
    return this.form.controls.promoRate.controls.promoTo;
  }

  private getExpandedStates() {
    const f = this.form.controls;
    return {
      commission: f.commission.controls.expanded.value,
      appraisal: f.appraisal.controls.expanded.value,
      bridge: f.bridge.controls.expanded.value,
      propertyInsurance: f.propertyInsurance.controls.expanded.value,
      lowEquityInsurance: f.lowEquityInsurance.controls.expanded.value,
      lifeInsurance: f.lifeInsurance.controls.expanded.value,
      jobLossInsurance: f.jobLossInsurance.controls.expanded.value,
      additionalCosts: f.additionalCosts.controls.expanded.value,
      promoRate: f.promoRate.controls.expanded.value,
    };
  }

  readonly subsectionsOpen = toSignal(
    this.form.valueChanges.pipe(map(() => this.getExpandedStates())),
    { initialValue: this.getExpandedStates() },
  );

  setSubsectionOpen(key: string, open: boolean): void {
    (this.form.get(`${key}.expanded`) as unknown as FormControl<boolean>)?.setValue(open);
  }

  get propInsSuffix(): string {
    return this.form.controls.propertyInsurance.controls.propInsCalcMethod.value ===
      InsuranceCalcMethod.FIXED_AMOUNT
      ? 'zł'
      : '%';
  }

  get propInsDecimals(): number {
    return this.form.controls.propertyInsurance.controls.propInsCalcMethod.value ===
      InsuranceCalcMethod.FIXED_AMOUNT
      ? 2
      : 4;
  }

  get lifeInsSuffix(): string {
    return this.form.controls.lifeInsurance.controls.lifeInsCalcMethod.value ===
      LifeInsuranceCalcMethod.FIXED_AMOUNT
      ? 'zł'
      : '%';
  }

  get lifeInsDecimals(): number {
    return this.form.controls.lifeInsurance.controls.lifeInsCalcMethod.value ===
      LifeInsuranceCalcMethod.FIXED_AMOUNT
      ? 2
      : 5;
  }

  get jobLossInsSuffix(): string {
    return this.form.controls.jobLossInsurance.controls.jobLossInsCalcMethod.value ===
      LifeInsuranceCalcMethod.FIXED_AMOUNT
      ? 'zł'
      : '%';
  }

  getAdditionalCostSuffix(index: number): string {
    return this.additionalCostsArray.at(index).controls.calcMethod.value ===
      LifeInsuranceCalcMethod.FIXED_AMOUNT
      ? 'zł'
      : '%';
  }

  addAdditionalCost() {
    this.formService.addAdditionalCost();
  }

  removeAdditionalCost(index: number) {
    this.formService.removeAdditionalCost(index);
  }

  private convertCommissionValue(): void {
    const commissionValue = this.commissionValueControl.value;
    const commissionCalcMethod = this.commissionCalcMethodControl.value;

    const loanAmount = this.formService.form.controls.basicData.controls.loanAmount.value;
    let convertedValue: number;

    if (loanAmount <= 0) {
      convertedValue = 0;
    } else if (commissionCalcMethod === CommissionCalcMethod.FIXED_AMOUNT) {
      convertedValue = Math.round(((loanAmount * commissionValue) / 100) * 100) / 100;
    } else {
      convertedValue = Math.round((commissionValue / loanAmount) * 100 * 10000) / 10000;
    }

    this.commissionValueControl.setValue(convertedValue);
  }
}
