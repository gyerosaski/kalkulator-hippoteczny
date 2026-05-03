import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import {
  InsuranceCalcMethod,
  InsuranceFrequency, LifeInsuranceCalcMethod
} from '../../../model';
import { FormService } from '../../../services/form/form';
import { FormatMonthPlPipe } from '../../../pipes/format-month-pl.pipe';

@Component({
  selector: 'app-overhead-costs-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormatMonthPlPipe],
  templateUrl: './overhead-costs-form.component.html',
  styleUrl: './overhead-costs-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverheadCostsFormComponent {
  private formService = inject(FormService);

  readonly insuranceFrequencyOptions: InsuranceFrequency[] = ['co rok', 'co miesiąc', 'jednorazowo'];
  readonly propertyInsFrequencyOptions: ('co rok' | 'co miesiąc')[] = ['co rok', 'co miesiąc'];
  readonly propertyInsCalcOptions: InsuranceCalcMethod[] = ['% wartości nieruchomości', '% kwoty kredytu', '% salda kredytu', 'znam kwotę'];
  readonly lifeInsCalcOptions: LifeInsuranceCalcMethod[] = ['% kwoty kredytu', '% salda kredytu', 'znam kwotę'];

  get form() { return this.formService.overheadCostsGroup; }
  get additionalCostsArray() { return this.formService.additionalCostsArray; }

  readonly commissionAmount = computed(() => {
    const mainForm = this.formService.form;
    const loanAmount = mainForm?.get('loanAmount')?.value || 0;
    const commPct = this.form?.get('commissionPct')?.value || 0;
    return Math.round(loanAmount * commPct) / 100;
  });

  addAdditionalCost() { this.formService.addAdditionalCost(); }
  removeAdditionalCost(index: number) { this.formService.removeAdditionalCost(index); }
}
