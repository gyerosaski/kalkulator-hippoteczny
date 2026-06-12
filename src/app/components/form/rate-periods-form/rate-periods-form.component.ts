import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { FormService } from '../../../services/form/form';
import { FormSectionId, RateType } from '../../../model';
import { RateTypeLabelPipe } from '../../../pipes/rate-type-label/rate-type-label.pipe';
import { FoldableSectionComponent } from '../../ui/foldable-section/foldable-section.component';
import { FieldComponent } from '../../ui/field/field.component';
import { NumberInputComponent } from '../../ui/number-input/number-input.component';
import { MonthPickerComponent } from '../../ui/month-picker/month-picker.component';
import { SegmentedComponent } from '../../ui/segmented/segmented.component';
import { BtnAddComponent } from '../../ui/btn-add/btn-add.component';
import { CardComponent } from '../../ui/card/card.component';
import { CardsGroupComponent } from '../../ui/cards-group/cards-group.component';

@Component({
  selector: 'app-rate-periods-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FoldableSectionComponent,
    FieldComponent,
    NumberInputComponent,
    MonthPickerComponent,
    SegmentedComponent,
    BtnAddComponent,
    CardComponent,
    CardsGroupComponent,
    RateTypeLabelPipe,
  ],
  templateUrl: './rate-periods-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatePeriodsFormComponent {
  private readonly formService = inject(FormService);

  protected readonly RateType = RateType;
  protected readonly FormSectionId = FormSectionId;

  readonly rateTypeOptions = Object.values(RateType);

  private readonly _ratePeriodsSync = toSignal(
    this.formService.ratePeriodsArray.valueChanges.pipe(map(() => null)),
    { initialValue: null },
  );

  protected readonly ratePeriodControls = computed(() => {
    this._ratePeriodsSync();
    return this.formService.ratePeriodsArray.controls;
  });

  addRatePeriod() {
    this.formService.addRatePeriod();
  }

  removeRatePeriod(index: number) {
    this.formService.removeRatePeriod(index);
  }
}
