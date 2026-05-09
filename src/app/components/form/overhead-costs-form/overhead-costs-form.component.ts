import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { InsuranceCalcMethod, InsuranceFrequency, LifeInsuranceCalcMethod } from '../../../model';
import { FormService } from '../../../services/form/form';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';
import { SectionComponent } from '../../ui/section/section.component';
import { FieldComponent } from '../../ui/field/field.component';
import { NumberInputComponent } from '../../ui/number-input/number-input.component';
import { MonthPickerComponent } from '../../ui/month-picker/month-picker.component';
import { SelectComponent } from '../../ui/select/select.component';
import { BtnAddComponent } from '../../ui/btn-add/btn-add.component';
import { CardComponent } from '../../ui/card/card.component';
import { CardsGroupComponent } from '../../ui/cards-group/cards-group.component';

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
    CardsGroupComponent,
  ],
  templateUrl: './overhead-costs-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverheadCostsFormComponent {
  private formService = inject(FormService);

  readonly insuranceFrequencyOptions: InsuranceFrequency[] = [
    'co rok',
    'co miesiąc',
    'jednorazowo',
  ];
  readonly propertyInsFrequencyOptions: ('co rok' | 'co miesiąc')[] = ['co rok', 'co miesiąc'];
  readonly propertyInsCalcOptions: InsuranceCalcMethod[] = [
    '% wartości nieruchomości',
    '% kwoty kredytu',
    '% salda kredytu',
    'znam kwotę',
  ];
  readonly lifeInsCalcOptions: LifeInsuranceCalcMethod[] = [
    '% kwoty kredytu',
    '% salda kredytu',
    'znam kwotę',
  ];

  get section() {
    return this.formService.overheadCostsSection;
  }
  get included() {
    return this.section.controls.included;
  }
  readonly includedEnabled = toSignal(
    this.formService.overheadCostsSection.controls.included.valueChanges,
    { initialValue: this.formService.overheadCostsSection.controls.included.value },
  );
  private readonly additionalCostsCount = toSignal(
    this.formService.additionalCostsArray.valueChanges.pipe(
      map(() => this.formService.additionalCostsArray.length),
    ),
    { initialValue: this.formService.additionalCostsArray.length },
  );
  get form() {
    return this.formService.overheadCostsGroup;
  }
  get additionalCostsArray() {
    return this.formService.additionalCostsArray;
  }

  readonly commissionAmount = computed(() => {
    const mainForm = this.formService.form;
    const loanAmount = mainForm?.get('loanAmount')?.value || 0;
    const commPct = this.form?.get('commissionPct')?.value || 0;
    return Math.round(loanAmount * commPct) / 100;
  });

  get propInsSuffix(): string {
    return this.form?.get('propInsCalcMethod')?.value === 'znam kwotę' ? 'zł' : '%';
  }
  get propInsDecimals(): number {
    return this.form?.get('propInsCalcMethod')?.value === 'znam kwotę' ? 2 : 4;
  }
  get lifeInsSuffix(): string {
    return this.form?.get('lifeInsCalcMethod')?.value === 'znam kwotę' ? 'zł' : '%';
  }
  get lifeInsDecimals(): number {
    return this.form?.get('lifeInsCalcMethod')?.value === 'znam kwotę' ? 2 : 5;
  }
  get jobLossInsSuffix(): string {
    return this.form?.get('jobLossInsCalcMethod')?.value === 'znam kwotę' ? 'zł' : '%';
  }

  getAdditionalCostSuffix(index: number): string {
    return this.additionalCostsArray.at(index).get('calcMethod')?.value === 'znam kwotę'
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
