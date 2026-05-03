import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormService } from '../../../services/form/form';
import { CalculatorService } from '../../../services/calculator/calculator.service';
import { FormatMonthPipe } from '../../../pipes/format-month/format-month.pipe';

@Component({
  selector: 'app-basic-data-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormatMonthPipe],
  templateUrl: './basic-data-form.component.html',
  styleUrl: './basic-data-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicDataFormComponent {
  private readonly formService = inject(FormService);
  private readonly calculatorService = inject(CalculatorService);

  collapsed = false;

  get form() {
    return this.formService.form;
  }

  onLtvChanged() {
    const v = this.form.getRawValue();
    const synced = this.calculatorService.syncLtvAmountValue(
      v.propertyValue,
      v.loanAmount,
      v.ltv,
      'ltv',
    );
    this.form.patchValue(synced, { emitEvent: false });
    this.form.updateValueAndValidity();
  }

  onLoanAmountChanged() {
    const v = this.form.getRawValue();
    const synced = this.calculatorService.syncLtvAmountValue(
      v.propertyValue,
      v.loanAmount,
      v.ltv,
      'loanAmount',
    );
    this.form.patchValue(synced, { emitEvent: false });
    this.form.updateValueAndValidity();
  }

  onPropertyValueChanged() {
    const v = this.form.getRawValue();
    const synced = this.calculatorService.syncLtvAmountValue(
      v.propertyValue,
      v.loanAmount,
      v.ltv,
      'propertyValue',
    );
    this.form.patchValue(synced, { emitEvent: false });
    this.form.updateValueAndValidity();
  }

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
  }
}
