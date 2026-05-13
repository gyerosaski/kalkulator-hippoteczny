import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CalcService } from '../calc.service';
import { SectionComponent } from '../ui/section.component';
import { FieldComponent } from '../ui/field.component';
import { NumberInputComponent } from '../ui/number-input.component';
import { MonthPickerComponent } from '../ui/month-picker.component';
import { SelectComponent } from '../ui/select.component';

@Component({
  selector: 'app-overpayments',
  standalone: true,
  imports: [
    SectionComponent,
    FieldComponent,
    NumberInputComponent,
    MonthPickerComponent,
    SelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-section
      title="Nadpłaty"
      [defaultOpen]="true"
      [toggleable]="true"
      [enabled]="calc.overpaymentsEnabled()"
      (enabledChange)="calc.overpaymentsEnabled.set($event)"
    >
      <!-- A. Reguła nadpłat (pola 1–4) -->
      <div class="cost-sub">
        <div class="cost-sub-head"><span class="cost-sub-num">A</span>Reguła nadpłat</div>
        <div class="row row--3">
          <app-field label="Jak często nadpłacasz?" num="1">
            <app-select
              [options]="freqOpts"
              [value]="calc.overFreq()"
              (valueChange)="calc.overFreq.set($any($event))"
            />
          </app-field>
          <app-field label="Kwota nadpłaty" num="3">
            <app-number-input
              [value]="calc.overAmount()"
              (valueChange)="calc.overAmount.set($event)"
              suffix="zł"
              [decimals]="2"
            />
          </app-field>
          <app-field label="Skutek nadpłaty" num="4">
            <app-select
              [options]="['niższa rata', 'skrócenie okresu']"
              [value]="calc.overEffect()"
              (valueChange)="calc.overEffect.set($any($event))"
            />
          </app-field>
        </div>
        <div class="row row--2">
          <app-field label="Data nadpłaty — od" num="2">
            <app-month-picker [value]="calc.overFrom()" />
          </app-field>
          <app-field label="do">
            <app-month-picker [value]="calc.overTo()" />
          </app-field>
        </div>
        <button class="btn btn--add">＋ Dodaj regułę nadpłaty</button>
      </div>

      <!-- B. Docelowa rata miesięczna (pola 5–7) -->
      <div class="cost-sub">
        <div class="cost-sub-head"><span class="cost-sub-num">B</span>Docelowa rata miesięczna</div>
        <div class="row row--2">
          <app-field label="Chcę co miesiąc płacić do banku ratę w wysokości" num="5">
            <app-number-input
              [value]="calc.targetRata()"
              (valueChange)="calc.targetRata.set($event)"
              suffix="zł"
              [decimals]="2"
            />
          </app-field>
          <app-field label="Skutek nadpłaty" num="7">
            <app-select
              [options]="['niższa rata', 'skrócenie okresu']"
              [value]="calc.targetEffect()"
              (valueChange)="calc.targetEffect.set($any($event))"
            />
          </app-field>
        </div>
        <div class="row row--2">
          <app-field label="Data nadpłaty — od" num="6">
            <app-month-picker [value]="calc.targetFrom()" />
          </app-field>
          <app-field label="do">
            <app-month-picker [value]="calc.targetTo()" />
          </app-field>
        </div>
      </div>

      <!-- C. Prowizja za wcześniejszą spłatę (pola 8–9) -->
      <div class="cost-sub">
        <div class="cost-sub-head">
          <span class="cost-sub-num">C</span>Prowizja za wcześniejszą spłatę
        </div>
        <div class="row row--2">
          <app-field label="Wysokość prowizji za wcześniejszą spłatę" num="8">
            <app-number-input
              [value]="calc.earlyRepayFee()"
              (valueChange)="calc.earlyRepayFee.set($event)"
              suffix="%"
              [decimals]="2"
            />
          </app-field>
          <app-field label="Bank pobiera prowizję do" num="9">
            <app-month-picker [value]="calc.earlyRepayFeeUntil()" />
          </app-field>
        </div>
      </div>
    </app-section>
  `,
})
export class OverpaymentsComponent {
  calc = inject(CalcService);
  freqOpts = ['jednorazowo', 'co miesiąc', 'co kwartał', 'co rok'];
}
