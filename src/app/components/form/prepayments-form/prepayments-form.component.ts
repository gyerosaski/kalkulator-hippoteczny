import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { FormService } from '../../../services/form/form';
import { PrepaymentFrequency, PrepaymentEffect } from '../../../model/mortgage.model';
import { SectionComponent } from '../../ui/section/section.component';
import { FieldComponent } from '../../ui/field/field.component';
import { NumberInputComponent } from '../../ui/number-input/number-input.component';
import { MonthPickerComponent } from '../../ui/month-picker/month-picker.component';
import { SelectComponent } from '../../ui/select/select.component';

@Component({
  selector: 'app-prepayments-form',
  standalone: true,
  imports: [ReactiveFormsModule, SectionComponent, FieldComponent, NumberInputComponent, MonthPickerComponent, SelectComponent],
  templateUrl: './prepayments-form.component.html',
  styleUrl: './prepayments-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrepaymentsFormComponent {
  readonly formService = inject(FormService);

  readonly prepaymentFrequencyOptions: PrepaymentFrequency[] = [
    'jednorazowo',
    'co miesiąc',
    'co kwartał',
    'co rok',
  ];
  readonly prepaymentEffectOptions: PrepaymentEffect[] = ['niższa rata', 'skrócenie okresu'];

  collapsed = false;

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

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
  }
}
