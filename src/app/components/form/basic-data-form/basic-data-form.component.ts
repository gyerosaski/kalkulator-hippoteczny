import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { FormService } from '../../../services/form/form';
import { CalculatorService } from '../../../services/calculator/calculator.service';
import { InstallmentType, LoanPeriodUnit, RateType } from '../../../model';
import { InstallmentTypeLabelPipe } from '../../../pipes/installment-type-label/installment-type-label.pipe';
import { RateTypeLabelPipe } from '../../../pipes/rate-type-label/rate-type-label.pipe';
import { LoanPeriodUnitLabelPipe } from '../../../pipes/loan-period-unit-label/loan-period-unit-label.pipe';
import { SectionComponent } from '../../ui/section/section.component';
import { FieldComponent } from '../../ui/field/field.component';
import { NumberInputComponent } from '../../ui/number-input/number-input.component';
import { MonthPickerComponent } from '../../ui/month-picker/month-picker.component';
import { SegmentedComponent } from '../../ui/segmented/segmented.component';
import { BtnAddComponent } from '../../ui/btn-add/btn-add.component';
import { CardComponent } from '../../ui/card/card.component';
import { CardsGroupComponent } from '../../ui/cards-group/cards-group.component';

@Component({
  selector: 'app-basic-data-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SectionComponent,
    FieldComponent,
    NumberInputComponent,
    MonthPickerComponent,
    SegmentedComponent,
    BtnAddComponent,
    CardComponent,
    CardsGroupComponent,
    InstallmentTypeLabelPipe,
    RateTypeLabelPipe,
    LoanPeriodUnitLabelPipe,
  ],
  templateUrl: './basic-data-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class BasicDataFormComponent {
  private readonly formService = inject(FormService);
  private readonly calculatorService = inject(CalculatorService);

  protected readonly RateType = RateType;

  readonly installmentTypeOptions = Object.values(InstallmentType);
  readonly rateTypeOptions = Object.values(RateType);
  readonly loanPeriodUnitOptions = Object.values(LoanPeriodUnit);

  private readonly _ratePeriodsSync = toSignal(
    this.formService.ratePeriodsArray.valueChanges.pipe(map(() => null)),
    { initialValue: null },
  );

  protected readonly ratePeriodControls = computed(() => {
    this._ratePeriodsSync();
    return this.formService.ratePeriodsArray.controls;
  });

  get form() {
    return this.formService.form;
  }

  get basicData() {
    return this.formService.form.controls.basicData;
  }

  get expandedControl() {
    return this.basicData.controls.expanded;
  }

  get propertyValueControl() {
    return this.basicData.controls.propertyValue;
  }

  get loanAmountControl() {
    return this.basicData.controls.loanAmount;
  }

  get ltvControl() {
    return this.basicData.controls.ltv;
  }

  get loanPeriodUnitControl() {
    return this.basicData.controls.loanPeriodUnit;
  }

  get startDateControl() {
    return this.basicData.controls.startDate;
  }

  get capitalStartDateControl() {
    return this.basicData.controls.capitalStartDate;
  }

  get installmentTypeControl() {
    return this.basicData.controls.installmentType;
  }

  get loanPeriodDisplayValue(): number {
    const months = this.basicData.controls.loanPeriod.value;
    return this.loanPeriodUnitControl.value === LoanPeriodUnit.YEARS
      ? Math.round((months / 12) * 100) / 100
      : months;
  }

  onLoanPeriodValueChanged(val: number): void {
    const months =
      this.loanPeriodUnitControl.value === LoanPeriodUnit.YEARS
        ? Math.round(val * 12)
        : Math.round(val);
    this.basicData.controls.loanPeriod.setValue(months);
    this.form.updateValueAndValidity();
  }

  onLtvChanged() {
    const v = this.basicData.getRawValue();
    const synced = this.calculatorService.syncLtvAmountValue(
      v.propertyValue,
      v.loanAmount,
      v.ltv,
      'ltv',
    );
    this.basicData.patchValue(synced, { emitEvent: false });
    this.form.updateValueAndValidity();
  }

  onLoanAmountChanged() {
    const v = this.basicData.getRawValue();
    const synced = this.calculatorService.syncLtvAmountValue(
      v.propertyValue,
      v.loanAmount,
      v.ltv,
      'loanAmount',
    );
    this.basicData.patchValue(synced, { emitEvent: false });
    this.form.updateValueAndValidity();
  }

  onPropertyValueChanged() {
    const v = this.basicData.getRawValue();
    const synced = this.calculatorService.syncLtvAmountValue(
      v.propertyValue,
      v.loanAmount,
      v.ltv,
      'propertyValue',
    );
    this.basicData.patchValue(synced, { emitEvent: false });
    this.form.updateValueAndValidity();
  }

  addRatePeriod() {
    this.formService.addRatePeriod();
  }

  removeRatePeriod(index: number) {
    this.formService.removeRatePeriod(index);
  }
}
