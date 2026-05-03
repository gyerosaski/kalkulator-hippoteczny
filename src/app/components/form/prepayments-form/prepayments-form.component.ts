import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { ReactiveFormsModule } from '@angular/forms';
import { FormService } from '../../../services/form/form';
import { PrepaymentFrequency, PrepaymentEffect } from '../../../model/mortgage.model';
import { FormatMonthPipe } from '../../../pipes/format-month/format-month.pipe';

@Component({
  selector: 'app-prepayments-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormatMonthPipe],
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
