import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormService } from '../../../services/form/form';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';
import { FormatMonthPipe } from '../../../pipes/format-month/format-month.pipe';

@Component({
  selector: 'app-tranches-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormatAmountPipe, FormatMonthPipe],
  templateUrl: './tranches-form.component.html',
  styleUrl: './tranches-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranchesFormComponent {
  readonly formService = inject(FormService);

  collapsed = false;

  get section() {
    return this.formService.tranchesSection;
  }
  get included() {
    return this.section.controls.included;
  }
  get fieldsGroup() {
    return this.section.controls.fields;
  }
  get form() {
    return this.formService.form;
  }
  get transzeArray() {
    return this.formService.transzeArray;
  }
  get transzeSuma() {
    return this.formService.transzeSuma;
  }

  addTransza() {
    this.formService.addTransza();
  }
  removeTransza(index: number) {
    this.formService.removeTransza(index);
  }
  clearTransze() {
    this.formService.clearTransze();
  }

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
  }
}
