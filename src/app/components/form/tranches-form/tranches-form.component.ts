import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { FormService } from '../../../services/form/form';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';
import { FormatMonthPipe } from '../../../pipes/format-month/format-month.pipe';
import { FormatCurrencyAmountPipe } from '../../../pipes/format-currency-amount/format-currency-amount.pipe';
import { SectionComponent } from '../../ui/section/section.component';
import { FieldComponent } from '../../ui/field/field.component';
import { NumberInputComponent } from '../../ui/number-input/number-input.component';
import { MonthPickerComponent } from '../../ui/month-picker/month-picker.component';

@Component({
  selector: 'app-tranches-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormatAmountPipe,
    FormatMonthPipe,
    FormatCurrencyAmountPipe,
    SectionComponent,
    FieldComponent,
    NumberInputComponent,
    MonthPickerComponent,
  ],
  templateUrl: './tranches-form.component.html',
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
  readonly includedEnabled = toSignal(
    this.formService.tranchesSection.controls.included.valueChanges,
    { initialValue: this.formService.tranchesSection.controls.included.value },
  );
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
