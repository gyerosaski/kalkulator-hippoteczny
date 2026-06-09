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
import { BtnRemoveComponent } from '../../ui/btn-remove/btn-remove.component';
import { CardComponent } from '../../ui/card/card.component';

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
    BtnRemoveComponent,
    CardComponent,
  ],
  templateUrl: './tranches-form.component.html',
  styleUrl: './tranches-form.component.scss',
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

  private readonly tranchesCount = toSignal(
    this.formService.tranchesArray.valueChanges.pipe(
      map(() => this.formService.tranchesArray.length),
    ),
    { initialValue: this.formService.tranchesArray.length },
  );

  readonly badge = computed(() =>
    this.isSectionEnabled() && this.tranchesCount() > 1
      ? `liczba transz: ${this.tranchesCount()}`
      : 'opcjonalne',
  );

  get tranchesArray() {
    return this.formService.tranchesArray;
  }

  get trancheSum() {
    return this.formService.trancheSum;
  }

  addTranche() {
    this.formService.addTranche();
  }

  removeTranche(index: number) {
    this.formService.removeTranche(index);
  }
}
