import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { FormService } from '../../../services/form/form';
import { PrepaymentFrequency, PrepaymentEffect } from '../../../model/mortgage.model';
import { PrepaymentFrequencyLabelPipe } from '../../../pipes/prepayment-frequency-label/prepayment-frequency-label.pipe';
import { PrepaymentEffectLabelPipe } from '../../../pipes/prepayment-effect-label/prepayment-effect-label.pipe';
import { SectionComponent } from '../../ui/section/section.component';
import { FieldComponent } from '../../ui/field/field.component';
import { NumberInputComponent } from '../../ui/number-input/number-input.component';
import { MonthPickerComponent } from '../../ui/month-picker/month-picker.component';
import { SelectComponent } from '../../ui/select/select.component';
import { BtnAddComponent } from '../../ui/btn-add/btn-add.component';
import { CardComponent } from '../../ui/card/card.component';
import { CardsGroupComponent } from '../../ui/cards-group/cards-group.component';

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
    CardsGroupComponent,
    PrepaymentFrequencyLabelPipe,
    PrepaymentEffectLabelPipe,
  ],
  templateUrl: './prepayments-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrepaymentsFormComponent {
  readonly formService = inject(FormService);

  protected readonly PrepaymentFrequency = PrepaymentFrequency;

  readonly prepaymentFrequencyOptions = Object.values(PrepaymentFrequency);
  readonly prepaymentEffectOptions = Object.values(PrepaymentEffect);

  get section() {
    return this.formService.prepaymentsSection;
  }
  get included() {
    return this.section.controls.included;
  }
  readonly includedEnabled = toSignal(
    this.formService.prepaymentsSection.controls.included.valueChanges,
    { initialValue: this.formService.prepaymentsSection.controls.included.value },
  );
  private readonly nadplatyCount = toSignal(
    this.formService.nadplatyRegulyArray.valueChanges.pipe(
      map(() => this.formService.nadplatyRegulyArray.length),
    ),
    { initialValue: this.formService.nadplatyRegulyArray.length },
  );
  readonly badge = computed(() =>
    this.includedEnabled() && this.nadplatyCount()! > 1
      ? `liczba reguł: ${this.nadplatyCount()}`
      : 'opcjonalne',
  );
  get fieldsGroup() {
    return this.section.controls.fields;
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
