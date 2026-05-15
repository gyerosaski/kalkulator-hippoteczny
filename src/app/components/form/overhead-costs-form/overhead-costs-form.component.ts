import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { InsuranceCalcMethod, InsuranceFrequency, LifeInsuranceCalcMethod } from '../../../model';
import { FormService } from '../../../services/form/form';
import { InsuranceFrequencyLabelPipe } from '../../../pipes/insurance-frequency-label/insurance-frequency-label.pipe';
import { InsuranceCalcMethodLabelPipe } from '../../../pipes/insurance-calc-method-label/insurance-calc-method-label.pipe';
import { LifeInsuranceCalcMethodLabelPipe } from '../../../pipes/life-insurance-calc-method-label/life-insurance-calc-method-label.pipe';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';
import { SectionComponent } from '../../ui/section/section.component';
import { ColorCodeMarkerVariant } from '../../ui/color-code-marker/color-code-marker.component';
import { FieldComponent } from '../../ui/field/field.component';
import { NumberInputComponent } from '../../ui/number-input/number-input.component';
import { MonthPickerComponent } from '../../ui/month-picker/month-picker.component';
import { SelectComponent } from '../../ui/select/select.component';
import { BtnAddComponent } from '../../ui/btn-add/btn-add.component';
import { CardComponent } from '../../ui/card/card.component';
import { SubsectionComponent } from '../../ui/subsection/subsection.component';
import { DividerComponent } from '../../ui/divider/divider.component';

@Component({
  selector: 'app-overhead-costs-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormatAmountPipe,
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
  ],
  templateUrl: './overhead-costs-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverheadCostsFormComponent {
  protected readonly ColorCodeMarkerVariant = ColorCodeMarkerVariant;

  private formService = inject(FormService);

  readonly insuranceFrequencyOptions = Object.values(InsuranceFrequency);
  readonly propertyInsFrequencyOptions = [InsuranceFrequency.YEARLY, InsuranceFrequency.MONTHLY];
  readonly propertyInsCalcOptions = Object.values(InsuranceCalcMethod);
  readonly lifeInsCalcOptions = Object.values(LifeInsuranceCalcMethod);

  get section() {
    return this.formService.overheadCostsSection;
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

  readonly commissionAmount = computed(() => {
    const mainForm = this.formService.form;
    const loanAmount = mainForm?.get('loanAmount')?.value || 0;
    const commPct = this.form.controls.commission.controls.commissionPct.value || 0;
    return Math.round(loanAmount * commPct) / 100;
  });

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
    return this.additionalCostsArray.at(index).get('calcMethod')?.value ===
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
}
