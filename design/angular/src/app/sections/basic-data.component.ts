import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CalcService, addMonths } from '../calc.service';
import { SectionComponent } from '../ui/section.component';
import { FieldComponent } from '../ui/field.component';
import { NumberInputComponent } from '../ui/number-input.component';
import { MonthPickerComponent } from '../ui/month-picker.component';
import { SegmentedComponent } from '../ui/segmented.component';
import { SelectComponent } from '../ui/select.component';
import { PeriodUnit } from '../models';

@Component({
  selector: 'app-basic-data',
  standalone: true,
  imports: [
    SectionComponent,
    FieldComponent,
    NumberInputComponent,
    MonthPickerComponent,
    SegmentedComponent,
    SelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-section title="Dane podstawowe" num="" badge="krok 1" [defaultOpen]="true">
      <div class="row row--2">
        <app-field label="Wartość nieruchomości" num="1">
          <app-number-input
            [value]="calc.propertyValue()"
            (valueChange)="calc.propertyValue.set($event)"
            suffix="zł"
            [decimals]="0"
          />
        </app-field>
        <app-field label="Kwota kredytu" num="2">
          <app-number-input
            [value]="calc.loanAmount()"
            (valueChange)="calc.loanAmount.set($event)"
            suffix="zł"
            [decimals]="0"
          />
        </app-field>
      </div>
      <div class="row row--2">
        <app-field label="LTV" num="3" hint="kwota / wartość">
          <app-number-input
            [value]="calc.ltv()"
            (valueChange)="calc.setLtv($event)"
            suffix="%"
            [decimals]="2"
          />
        </app-field>
        <app-field label="Okres kredytowania" num="4">
          <div class="period-input">
            <app-number-input
              [value]="periodValue()"
              (valueChange)="onPeriodChange($event)"
              [suffix]="periodUnit() === 'lata' ? 'lat' : 'm-cy'"
              [decimals]="periodUnit() === 'lata' ? 1 : 0"
            />
            <div class="seg seg--compact">
              <button
                class="seg-btn"
                [class.is-on]="periodUnit() === 'lata'"
                (click)="periodUnit.set('lata')"
              >
                lata
              </button>
              <button
                class="seg-btn"
                [class.is-on]="periodUnit() === 'miesiące'"
                (click)="periodUnit.set('miesiące')"
              >
                m-ce
              </button>
            </div>
          </div>
        </app-field>
      </div>
      <div class="row row--2">
        <app-field label="Data uruchomienia kredytu" num="5">
          <app-month-picker [value]="calc.startDate()" />
        </app-field>
        <app-field label="Początek spłat kapitału" num="6">
          <div class="inline">
            <app-month-picker [value]="nextMonth()" [disabled]="true" />
            <button class="btn btn--mini">Edytuj</button>
          </div>
        </app-field>
      </div>
      <div class="row row--2">
        <app-field label="Jakie raty?">
          <app-segmented
            [options]="['równe', 'malejące']"
            [value]="calc.installmentType()"
            (valueChange)="calc.installmentType.set($any($event))"
          />
        </app-field>
        <app-field label="Rodzaj stopy" num="7">
          <app-select
            [options]="['zmienna', 'stała']"
            [value]="calc.rateType()"
            (valueChange)="calc.rateType.set($any($event))"
          />
        </app-field>
      </div>
      <div class="rate-block">
        <div class="rate-grid">
          <app-field
            label="Oprocentowanie"
            num="8"
            [hint]="calc.rateType() === 'zmienna' ? 'WIBOR + Marża' : 'wartość stała'"
          >
            <app-number-input
              [value]="calc.rateType() === 'zmienna' ? calc.wibor() + calc.margin() : calc.rate()"
              (valueChange)="calc.rate.set($event)"
              suffix="%"
              [decimals]="2"
              [disabled]="calc.rateType() === 'zmienna'"
            />
          </app-field>
          @if (calc.rateType() === 'zmienna') {
            <app-field label="WIBOR" num="8a">
              <app-number-input
                [value]="calc.wibor()"
                (valueChange)="calc.wibor.set($event)"
                suffix="%"
                [decimals]="2"
              />
            </app-field>
            <app-field label="Marża" num="8b">
              <app-number-input
                [value]="calc.margin()"
                (valueChange)="calc.margin.set($event)"
                suffix="%"
                [decimals]="2"
              />
            </app-field>
          }
        </div>
        <button class="btn btn--add">＋ Dodaj okres oprocentowania</button>
      </div>
    </app-section>
  `,
})
export class BasicDataComponent {
  calc = inject(CalcService);
  periodUnit = signal<PeriodUnit>('lata');

  periodValue = computed(() => {
    const y = this.calc.years(),
      m = this.calc.months();
    return this.periodUnit() === 'lata' ? y + m / 12 : y * 12 + m;
  });

  nextMonth = computed(() => addMonths(this.calc.startDate(), 1));

  onPeriodChange(v: number) {
    if (this.periodUnit() === 'lata') {
      const y = Math.floor(v);
      const m = Math.round((v - y) * 12);
      this.calc.years.set(y);
      this.calc.months.set(m);
    } else {
      this.calc.years.set(Math.floor(v / 12));
      this.calc.months.set(Math.round(v) % 12);
    }
  }
}
