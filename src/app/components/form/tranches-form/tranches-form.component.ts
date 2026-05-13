import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { FormService } from '../../../services/form/form';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';
import { SectionComponent } from '../../ui/section/section.component';
import { FieldComponent } from '../../ui/field/field.component';
import { NumberInputComponent } from '../../ui/number-input/number-input.component';
import { MonthPickerComponent } from '../../ui/month-picker/month-picker.component';
import { BtnAddComponent } from '../../ui/btn-add/btn-add.component';
import { CardComponent } from '../../ui/card/card.component';
import { CardsGroupComponent } from '../../ui/cards-group/cards-group.component';

@Component({
  selector: 'app-tranches-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormatAmountPipe,
    SectionComponent,
    FieldComponent,
    NumberInputComponent,
    MonthPickerComponent,
    BtnAddComponent,
    CardComponent,
    CardsGroupComponent,
  ],
  templateUrl: './tranches-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranchesFormComponent {
  readonly formService = inject(FormService);
  get section() {
    return this.formService.tranchesSection;
  }

  get sectionEnabledControl() {
    return this.section.controls.enabled;
  }

  readonly isSectionEnabled = toSignal(
    this.formService.tranchesSection.controls.enabled.valueChanges,
    { initialValue: this.formService.tranchesSection.controls.enabled.value },
  );

  private readonly transzeCount = toSignal(
    this.formService.transzeArray.valueChanges.pipe(
      map(() => this.formService.transzeArray.length),
    ),
    { initialValue: this.formService.transzeArray.length },
  );

  readonly badge = computed(() =>
    this.isSectionEnabled() && this.transzeCount()! > 1
      ? `liczba transz: ${this.transzeCount()}`
      : 'opcjonalne',
  );

  get fieldsGroup() {
    return this.section.controls.fields;
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
}
