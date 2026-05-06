import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormService } from '../../../services/form/form';
import { CalculatorService } from '../../../services/calculator/calculator.service';
import { FormatMonthPipe } from '../../../pipes/format-month/format-month.pipe';
import { SectionComponent } from '../../ui/section/section.component';
import { FieldComponent } from '../../ui/field/field.component';
import { NumberInputComponent } from '../../ui/number-input/number-input.component';
import { MonthPickerComponent } from '../../ui/month-picker/month-picker.component';
import { SegmentedComponent } from '../../ui/segmented/segmented.component';

@Component({
  selector: 'app-basic-data-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormatMonthPipe,
    SectionComponent,
    FieldComponent,
    NumberInputComponent,
    MonthPickerComponent,
    SegmentedComponent,
  ],
  templateUrl: './basic-data-form.component.html',
  styleUrl: './basic-data-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicDataFormComponent {
  private readonly formService = inject(FormService);
  private readonly calculatorService = inject(CalculatorService);
  collapsed = false;
  loanPeriodUnit: 'lata' | 'miesiące' = 'lata';

  get form() {
    return this.formService.form;
  }

  get basicData() {
    return this.formService.form.controls.basicData;
  }

  get ratePeriods() {
    return this.formService.ratePeriodsArray;
  }

  get loanPeriodDisplayValue(): number {
    const months = this.basicData.controls.loanPeriod.value;
    return this.loanPeriodUnit === 'lata' ? Math.round((months / 12) * 100) / 100 : months;
  }

  onLoanPeriodDisplayChanged(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.onLoanPeriodValueChanged(val);
  }

  onLoanPeriodValueChanged(val: number): void {
    const months = this.loanPeriodUnit === 'lata' ? Math.round(val * 12) : Math.round(val);
    this.basicData.controls.loanPeriod.setValue(months);
    this.form.updateValueAndValidity();
  }

  onLoanPeriodUnitChanged(unit: string): void {
    this.loanPeriodUnit = unit as 'lata' | 'miesiące';
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
  toggleCollapsed() {
    this.collapsed = !this.collapsed;
  }

  addRatePeriod() {
    this.formService.addRatePeriod();
  }

  removeRatePeriod(index: number) {
    this.formService.removeRatePeriod(index);
  }
}
