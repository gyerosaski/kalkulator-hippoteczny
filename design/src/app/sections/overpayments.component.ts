import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CalcService, addMonths } from '../calc.service';
import { SectionComponent } from '../ui/section.component';
import { FieldComponent } from '../ui/field.component';
import { NumberInputComponent } from '../ui/number-input.component';
import { MonthPickerComponent } from '../ui/month-picker.component';
import { SelectComponent } from '../ui/select.component';

@Component({
  selector: 'app-overpayments',
  standalone: true,
  imports: [SectionComponent, FieldComponent, NumberInputComponent,
            MonthPickerComponent, SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-section title="Nadpłaty" [defaultOpen]="true">
      <div class="row row--3">
        <app-field label="Jak często nadpłacasz?" num="1">
          <app-select [options]="freqOpts" [value]="calc.overFreq()"
            (valueChange)="calc.overFreq.set($any($event))"/>
        </app-field>
        <app-field label="Kwota nadpłaty" num="3">
          <app-number-input [value]="calc.overAmount()" (valueChange)="calc.overAmount.set($event)"
            suffix="zł" [decimals]="2"/>
        </app-field>
        <app-field label="Skutek nadpłaty" num="4">
          <app-select [options]="['niższa rata','skrócenie okresu']" [value]="calc.overEffect()"
            (valueChange)="calc.overEffect.set($any($event))"/>
        </app-field>
      </div>
      <div class="row row--2">
        <app-field label="Data nadpłaty — od" num="2">
          <app-month-picker [value]="dateFrom()"/>
        </app-field>
        <app-field label="do">
          <app-month-picker [value]="dateTo()"/>
        </app-field>
      </div>
    </app-section>
  `,
})
export class OverpaymentsComponent {
  calc = inject(CalcService);
  freqOpts = ['jednorazowo', 'co miesiąc', 'co kwartał', 'co rok'];
  dateFrom = computed(() => addMonths(this.calc.startDate(), 1));
  dateTo = computed(() => addMonths(this.calc.startDate(), 240));
}
