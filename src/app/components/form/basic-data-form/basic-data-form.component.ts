import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormService } from '../../../services/form/form';
import { CalculatorService } from '../../../services/calculator/calculator.service';
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
  ],
  templateUrl: './basic-data-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicDataFormComponent {
  private readonly formService = inject(FormService);
  private readonly calculatorService = inject(CalculatorService);
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

  addRatePeriod() {
    this.formService.addRatePeriod();
  }

  removeRatePeriod(index: number) {
    this.formService.removeRatePeriod(index);
  }
}
