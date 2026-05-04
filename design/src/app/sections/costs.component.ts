import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CalcService } from '../calc.service';
import { SectionComponent } from '../ui/section.component';
import { FieldComponent } from '../ui/field.component';
import { NumberInputComponent } from '../ui/number-input.component';
import { SelectComponent } from '../ui/select.component';
import { PlnPipe } from '../pipes/pln.pipe';

@Component({
  selector: 'app-costs',
  standalone: true,
  imports: [SectionComponent, FieldComponent, NumberInputComponent, SelectComponent, PlnPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-section title="Koszty okołokredytowe i promocje" badge="opcjonalnie" [defaultOpen]="true">
      <div class="row row--2">
        <app-field label="Prowizja za udzielenie" num="1" [hint]="'= ' + (commissionPln() | pln) + ' zł'">
          <app-number-input [value]="calc.commissionPct()" (valueChange)="calc.commissionPct.set($event)"
            suffix="%" [decimals]="2"/>
        </app-field>
        <app-field label="Opłata za wycenę" num="2">
          <app-number-input [value]="calc.valuationFee()" (valueChange)="calc.valuationFee.set($event)"
            suffix="zł" [decimals]="2"/>
        </app-field>
      </div>
      <div class="row row--2">
        <app-field label="Ubezp. pomostowe — bank podwyższa o" num="3">
          <app-number-input [value]="calc.bridgeRate()" (valueChange)="calc.bridgeRate.set($event)"
            suffix="%" [decimals]="2"/>
        </app-field>
        <app-field label="przez">
          <app-number-input [value]="calc.bridgeMonths()" (valueChange)="calc.bridgeMonths.set($event)"
            suffix="m-cy" [decimals]="0"/>
        </app-field>
      </div>
      <div class="row row--3">
        <app-field label="Ubezp. nieruchomości — częstotliwość" num="4a">
          <app-select [options]="['co rok','co miesiąc']" value="co rok" (valueChange)="0"/>
        </app-field>
        <app-field label="Wyliczenie składki" num="4b">
          <app-select
            [options]="['% wartości nieruchomości','% kwoty kredytu','% salda kredytu','znam kwotę']"
            value="% wartości nieruchomości" (valueChange)="0"/>
        </app-field>
        <app-field label="Wartość">
          <app-number-input [value]="calc.insurancePct() * 10000"
            (valueChange)="calc.insurancePct.set($event / 10000)" suffix="‰" [decimals]="2"/>
        </app-field>
      </div>
      <div class="muted small">Pozostałe pozycje (ubezp. niskiego wkładu, na życie, od utraty pracy, dodatkowe koszty, promocyjne oprocentowanie) — schowane dla czytelności.</div>
    </app-section>
  `,
})
export class CostsComponent {
  calc = inject(CalcService);
  commissionPln = computed(() => this.calc.commissionPct() / 100 * this.calc.loanAmount());
}
