import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormService } from '../../../services/form/form';
import { PrepaymentFrequency, PrepaymentEffect } from '../../../model';
import { PrepaymentFrequencyLabelPipe } from '../../../pipes/prepayment-frequency-label/prepayment-frequency-label.pipe';
import { PrepaymentEffectLabelPipe } from '../../../pipes/prepayment-effect-label/prepayment-effect-label.pipe';
import { SectionComponent } from '../../ui/section/section.component';
import { ColorCodeMarkerVariant } from '../../../model';
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

  protected readonly ColorCodeMarkerVariant = ColorCodeMarkerVariant;
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

  private readonly nadplatyCount = toSignal(
    this.formService.nadplatyRegulyArray.valueChanges.pipe(
      map(() => this.formService.nadplatyRegulyArray.length),
    ),
    { initialValue: this.formService.nadplatyRegulyArray.length },
  );

  readonly badge = computed(() =>
    this.isSectionEnabled() && this.nadplatyCount()! > 1
      ? `liczba reguł: ${this.nadplatyCount()}`
      : 'opcjonalne',
  );

  get prepaymentsGroup() {
    return this.formService.prepaymentsGroup;
  }

  private getExpandedStates() {
    const f = this.prepaymentsGroup.controls;
    return {
      prepaymentRules: f.prepaymentRules.controls.expanded.value,
      rataDocelowaRegula: f.rataDocelowaRegula.controls.expanded.value,
      prowizjaWczesniejszaSplata: f.prowizjaWczesniejszaSplata.controls.expanded.value,
    };
  }

  readonly subsectionsOpen = toSignal(
    this.formService.prepaymentsGroup.valueChanges.pipe(map(() => this.getExpandedStates())),
    { initialValue: this.getExpandedStates() },
  );

  setSubsectionOpen(key: string, open: boolean): void {
    (this.prepaymentsGroup.get(`${key}.expanded`) as unknown as FormControl<boolean>)?.setValue(
      open,
    );
  }

  get nadplatyRegulyArray() {
    return this.formService.nadplatyRegulyArray;
  }

  addNadplataRegula() {
    this.formService.addNadplataRegula();
  }

  removeNadplataRegula(index: number) {
    this.formService.removeNadplataRegula(index);
  }

  onNadplataFrequencyChanged(index: number) {
    this.formService.onNadplataFrequencyChanged(index);
  }

  onNadplataFromChanged(index: number) {
    this.formService.onNadplataFromChanged(index);
  }
}
