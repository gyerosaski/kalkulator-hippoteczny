import { Component, inject, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormService } from '../../../services/form/form';
import { PrepaymentFrequency, PrepaymentEffect } from '../../../model';
import { PrepaymentFrequencyLabelPipe } from '../../../pipes/prepayment-frequency-label/prepayment-frequency-label.pipe';
import { PrepaymentEffectLabelPipe } from '../../../pipes/prepayment-effect-label/prepayment-effect-label.pipe';
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

@Component({
  selector: 'app-prepayments-form',
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
    PrepaymentFrequencyLabelPipe,
    PrepaymentEffectLabelPipe,
  ],
  templateUrl: './prepayments-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrepaymentsFormComponent {
  private readonly formService = inject(FormService);

  protected readonly colorCodeArea = ColorCodeArea;
  protected readonly PrepaymentFrequency = PrepaymentFrequency;

  readonly prepaymentFrequencyOptions = Object.values(PrepaymentFrequency);
  readonly prepaymentEffectOptions = Object.values(PrepaymentEffect);

  get section() {
    return this.formService.prepaymentsSection;
  }

  get sectionEnabledControl() {
    return this.section.controls.enabled;
  }

  readonly isSectionEnabled = toSignal(
    this.formService.prepaymentsSection.controls.enabled.valueChanges,
    { initialValue: this.formService.prepaymentsSection.controls.enabled.value },
  );

  private readonly prepaymentRulesCount = toSignal(
    this.formService.prepaymentRulesArray.valueChanges.pipe(
      map(() => this.formService.prepaymentRulesArray.length),
    ),
    { initialValue: this.formService.prepaymentRulesArray.length },
  );

  readonly badge = computed(() =>
    this.isSectionEnabled() && this.prepaymentRulesCount()! > 1
      ? `liczba reguł: ${this.prepaymentRulesCount()}`
      : 'opcjonalne',
  );

  get prepaymentsGroup() {
    return this.formService.prepaymentsGroup;
  }

  readonly openSubsection = signal<string | null>(null);

  setSubsectionOpen(key: string, open: boolean): void {
    this.openSubsection.set(open ? key : null);
  }

  get prepaymentRulesArray() {
    return this.formService.prepaymentRulesArray;
  }

  get targetRateControl(): FormControl<number> {
    return this.prepaymentsGroup.controls.rataDocelowaRegula.controls.targetRate;
  }

  get targetInstallmentFromControl(): FormControl<string> {
    return this.prepaymentsGroup.controls.rataDocelowaRegula.controls.from;
  }

  get targetInstallmentToControl(): FormControl<string> {
    return this.prepaymentsGroup.controls.rataDocelowaRegula.controls.to;
  }

  get targetInstallmentEffectControl(): FormControl<PrepaymentEffect> {
    return this.prepaymentsGroup.controls.rataDocelowaRegula.controls.effect;
  }

  get earlyRepaymentRatePctControl(): FormControl<number> {
    return this.prepaymentsGroup.controls.prowizjaWczesniejszaSplata.controls.ratePct;
  }

  get earlyRepaymentValidUntilControl(): FormControl<string> {
    return this.prepaymentsGroup.controls.prowizjaWczesniejszaSplata.controls.validUntil;
  }

  addPrepaymentRule() {
    this.formService.addPrepaymentRule();
  }

  removePrepaymentRule(index: number) {
    this.formService.removePrepaymentRule(index);
  }

  onPrepaymentFrequencyChanged(index: number) {
    this.formService.onPrepaymentFrequencyChanged(index);
  }

  onPrepaymentFromChanged(index: number) {
    this.formService.onPrepaymentFromChanged(index);
  }
}
