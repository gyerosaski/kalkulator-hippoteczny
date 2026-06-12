import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormService } from '../../../services/form/form';
import { CalculatorService } from '../../../services/calculator/calculator.service';
import { FormSectionId, InstallmentType, LoanPeriodUnit } from '../../../model';
import { InstallmentTypeLabelPipe } from '../../../pipes/installment-type-label/installment-type-label.pipe';
import { LoanPeriodUnitLabelPipe } from '../../../pipes/loan-period-unit-label/loan-period-unit-label.pipe';
import { FoldableSectionComponent } from '../../ui/foldable-section/foldable-section.component';
import { FieldComponent } from '../../ui/field/field.component';
import { NumberInputComponent } from '../../ui/number-input/number-input.component';
import { MonthPickerComponent } from '../../ui/month-picker/month-picker.component';
import { SegmentedComponent } from '../../ui/segmented/segmented.component';

@Component({
  selector: 'app-basic-data-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FoldableSectionComponent,
    FieldComponent,
    NumberInputComponent,
    MonthPickerComponent,
    SegmentedComponent,
    InstallmentTypeLabelPipe,
    LoanPeriodUnitLabelPipe,
  ],
  templateUrl: './basic-data-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class BasicDataFormComponent {
  private readonly formService = inject(FormService);
  private readonly calculatorService = inject(CalculatorService);

  protected readonly FormSectionId = FormSectionId;

  readonly installmentTypeOptions = Object.values(InstallmentType);
  readonly loanPeriodUnitOptions = Object.values(LoanPeriodUnit);

  get form() {
    return this.formService.form;
  }

  get basicData() {
    return this.formService.form.controls.basicData;
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
}
