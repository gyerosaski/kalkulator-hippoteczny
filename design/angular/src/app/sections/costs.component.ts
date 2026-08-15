import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CalcService } from '../calc.service';
import { SectionComponent } from '../ui/section.component';
import { FieldComponent } from '../ui/field.component';
import { NumberInputComponent } from '../ui/number-input.component';
import { SelectComponent } from '../ui/select.component';
import { MonthPickerComponent } from '../ui/month-picker.component';
import { PlnPipe } from '../pipes/pln.pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-costs',
  standalone: true,
  imports: [
    SectionComponent, FieldComponent, NumberInputComponent,
    SelectComponent, MonthPickerComponent, PlnPipe, FormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-section title="Koszty okołokredytowe i promocje" badge="opcjonalnie"
      [defaultOpen]="true" [toggleable]="true"
      [enabled]="calc.costsEnabled()" (enabledChange)="calc.costsEnabled.set($event)">

      <!-- 1. Prowizja za udzielenie -->
      <div class="cost-sub cost-sub--acc" [class.is-open]="openCostSub() === 1" [class.is-closed]="openCostSub() !== 1">
        <button type="button" class="cost-sub-head" (click)="toggleCostSub(1)" [attr.aria-expanded]="openCostSub() === 1"><span class="cost-sub-num">1</span><span class="cost-sub-title">Prowizja za udzielenie</span><svg class="cost-sub-chev" width="10" height="10" viewBox="0 0 10 10"><path d="M3 1 L7 5 L3 9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <div class="cost-sub-body">
        <div class="row row--2">
          <app-field label="Prowizja za udzielenie" [hint]="'= ' + (commissionPln() | pln) + ' zł'">
            <app-number-input [value]="calc.commissionPct()" (valueChange)="calc.commissionPct.set($event)"
              suffix="%" [decimals]="2"/>
          </app-field>
          <div></div>
        </div>
        </div>
      </div>

      <!-- 2. Opłata za wycenę -->
      <div class="cost-sub cost-sub--acc" [class.is-open]="openCostSub() === 2" [class.is-closed]="openCostSub() !== 2">
        <button type="button" class="cost-sub-head" (click)="toggleCostSub(2)" [attr.aria-expanded]="openCostSub() === 2"><span class="cost-sub-num">2</span><span class="cost-sub-title">Opłata za wycenę</span><svg class="cost-sub-chev" width="10" height="10" viewBox="0 0 10 10"><path d="M3 1 L7 5 L3 9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <div class="cost-sub-body">
        <div class="row row--2">
          <app-field label="Opłata za wycenę">
            <app-number-input [value]="calc.valuationFee()" (valueChange)="calc.valuationFee.set($event)"
              suffix="zł" [decimals]="2"/>
          </app-field>
          <div></div>
        </div>
        </div>
      </div>

      <!-- 3. Ubezpieczenie pomostowe -->
      <div class="cost-sub cost-sub--acc" [class.is-open]="openCostSub() === 3" [class.is-closed]="openCostSub() !== 3">
        <button type="button" class="cost-sub-head" (click)="toggleCostSub(3)" [attr.aria-expanded]="openCostSub() === 3"><span class="cost-sub-num">3</span><span class="cost-sub-title">Ubezpieczenie pomostowe</span><svg class="cost-sub-chev" width="10" height="10" viewBox="0 0 10 10"><path d="M3 1 L7 5 L3 9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <div class="cost-sub-body">
        <div class="row row--2">
          <app-field label="Bank podwyższa oprocentowanie o">
            <app-number-input [value]="calc.bridgeRate()" (valueChange)="calc.bridgeRate.set($event)"
              suffix="%" [decimals]="2"/>
          </app-field>
          <app-field label="przez">
            <app-number-input [value]="calc.bridgeMonths()" (valueChange)="calc.bridgeMonths.set($event)"
              suffix="miesięcy" [decimals]="0"/>
          </app-field>
        </div>
        </div>
      </div>

      <!-- 4. Ubezpieczenie nieruchomości -->
      <div class="cost-sub cost-sub--acc" [class.is-open]="openCostSub() === 4" [class.is-closed]="openCostSub() !== 4">
        <button type="button" class="cost-sub-head" (click)="toggleCostSub(4)" [attr.aria-expanded]="openCostSub() === 4"><span class="cost-sub-num">4</span><span class="cost-sub-title">Ubezpieczenie nieruchomości</span><svg class="cost-sub-chev" width="10" height="10" viewBox="0 0 10 10"><path d="M3 1 L7 5 L3 9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <div class="cost-sub-body">
        <div class="row row--3">
          <app-field label="Jak często opłacana jest składka?" num="4a">
            <app-select [options]="['co rok','co miesiąc']"
              [value]="calc.propInsFreq()" (valueChange)="calc.propInsFreq.set($any($event))"/>
          </app-field>
          <app-field label="Jak wyliczana jest składka?" num="4b">
            <app-select
              [options]="['% wartości nieruchomości','% kwoty kredytu','% salda kredytu','znam kwotę']"
              [value]="calc.propInsMode()" (valueChange)="calc.propInsMode.set($any($event))"/>
          </app-field>
          <app-field [label]="calc.propInsMode() === 'znam kwotę' ? 'Kwota składki' : 'Wartość składki'">
            <app-number-input
              [value]="calc.propInsMode() === 'znam kwotę' ? calc.insurancePct() : calc.insurancePct() * 100"
              (valueChange)="calc.insurancePct.set(calc.propInsMode() === 'znam kwotę' ? $event : $event / 100)"
              [suffix]="calc.propInsMode() === 'znam kwotę' ? 'zł' : '%'" [decimals]="4"/>
          </app-field>
        </div>
        <div class="row row--2">
          <app-field label="Od">
            <app-month-picker [value]="calc.propInsFrom()"/>
          </app-field>
          <app-field label="do">
            <app-month-picker [value]="calc.propInsTo()"/>
          </app-field>
        </div>
        </div>
      </div>

      <!-- 5. Ubezpieczenie niskiego wkładu -->
      <div class="cost-sub cost-sub--acc" [class.is-open]="openCostSub() === 5" [class.is-closed]="openCostSub() !== 5">
        <button type="button" class="cost-sub-head" (click)="toggleCostSub(5)" [attr.aria-expanded]="openCostSub() === 5"><span class="cost-sub-num">5</span><span class="cost-sub-title">Ubezpieczenie niskiego wkładu</span><svg class="cost-sub-chev" width="10" height="10" viewBox="0 0 10 10"><path d="M3 1 L7 5 L3 9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <div class="cost-sub-body">
        <div class="row row--2">
          <app-field label="Bank podwyższa oprocentowanie o">
            <app-number-input [value]="calc.lowDownRate()" (valueChange)="calc.lowDownRate.set($event)"
              suffix="%" [decimals]="2"/>
          </app-field>
          <div></div>
        </div>
        </div>
      </div>

      <!-- 6. Ubezpieczenie na życie -->
      <div class="cost-sub cost-sub--acc" [class.is-open]="openCostSub() === 6" [class.is-closed]="openCostSub() !== 6">
        <button type="button" class="cost-sub-head" (click)="toggleCostSub(6)" [attr.aria-expanded]="openCostSub() === 6"><span class="cost-sub-num">6</span><span class="cost-sub-title">Ubezpieczenie na życie</span><svg class="cost-sub-chev" width="10" height="10" viewBox="0 0 10 10"><path d="M3 1 L7 5 L3 9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <div class="cost-sub-body">
        <div class="row row--3">
          <app-field label="Jak często opłacana jest składka?" num="6a">
            <app-select [options]="['co rok','co miesiąc','jednorazowo']"
              [value]="calc.lifeFreq()" (valueChange)="calc.lifeFreq.set($any($event))"/>
          </app-field>
          <app-field label="Jak wyliczana jest składka?" num="6b">
            <app-select [options]="['% kwoty kredytu','% salda kredytu','znam kwotę']"
              [value]="calc.lifeMode()" (valueChange)="calc.lifeMode.set($any($event))"/>
          </app-field>
          <app-field [label]="calc.lifeMode() === 'znam kwotę' ? 'Kwota składki' : 'Wartość składki'">
            <app-number-input [value]="calc.lifeValue()" (valueChange)="calc.lifeValue.set($event)"
              [suffix]="calc.lifeMode() === 'znam kwotę' ? 'zł' : '%'" [decimals]="5"/>
          </app-field>
        </div>
        <div class="row row--2">
          <app-field label="Od">
            <app-month-picker [value]="calc.lifeFrom()"/>
          </app-field>
          <app-field label="do">
            <app-month-picker [value]="calc.lifeTo()"/>
          </app-field>
        </div>
        </div>
      </div>

      <!-- 7. Ubezpieczenie od utraty pracy -->
      <div class="cost-sub cost-sub--acc" [class.is-open]="openCostSub() === 7" [class.is-closed]="openCostSub() !== 7">
        <button type="button" class="cost-sub-head" (click)="toggleCostSub(7)" [attr.aria-expanded]="openCostSub() === 7"><span class="cost-sub-num">7</span><span class="cost-sub-title">Ubezpieczenie od utraty pracy</span><svg class="cost-sub-chev" width="10" height="10" viewBox="0 0 10 10"><path d="M3 1 L7 5 L3 9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <div class="cost-sub-body">
        <div class="row row--3">
          <app-field label="Jak często opłacana jest składka?" num="7a">
            <app-select [options]="['jednorazowo','co rok','co miesiąc']"
              [value]="calc.jobFreq()" (valueChange)="calc.jobFreq.set($any($event))"/>
          </app-field>
          <app-field label="Jak wyliczana jest składka?" num="7b">
            <app-select [options]="['% kwoty kredytu','% salda kredytu','znam kwotę']"
              [value]="calc.jobMode()" (valueChange)="calc.jobMode.set($any($event))"/>
          </app-field>
          <app-field [label]="calc.jobMode() === 'znam kwotę' ? 'Kwota składki' : 'Wartość składki'">
            <app-number-input [value]="calc.jobValue()" (valueChange)="calc.jobValue.set($event)"
              [suffix]="calc.jobMode() === 'znam kwotę' ? 'zł' : '%'" [decimals]="2"/>
          </app-field>
        </div>
        <div class="row row--2">
          <app-field label="Od">
            <app-month-picker [value]="calc.jobFrom()"/>
          </app-field>
          <div></div>
        </div>
        </div>
      </div>

      <!-- 8. Dodatkowe koszty -->
      <div class="cost-sub cost-sub--acc" [class.is-open]="openCostSub() === 8" [class.is-closed]="openCostSub() !== 8">
        <button type="button" class="cost-sub-head" (click)="toggleCostSub(8)" [attr.aria-expanded]="openCostSub() === 8"><span class="cost-sub-num">8</span><span class="cost-sub-title">Dodatkowe koszty</span><svg class="cost-sub-chev" width="10" height="10" viewBox="0 0 10 10"><path d="M3 1 L7 5 L3 9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <div class="cost-sub-body">
        @for (c of calc.extraCosts(); track c.id; let idx = $index) {
          <div class="extra-cost">
            <div class="extra-cost-head">
              <span class="extra-cost-tag">{{ idx + 1 }}</span>
              @if (calc.extraCosts().length > 1) {
                <button class="ico-btn ico-btn--danger" title="Usuń"
                  (click)="calc.removeExtraCost(c.id)">×</button>
              }
            </div>
            <div class="row row--2">
              <app-field label="Nazwa kosztu">
                <div class="inp">
                  <input type="text" [ngModel]="c.name" placeholder="np. obsługa konta"
                    (ngModelChange)="calc.updateExtraCost(c.id, { name: $event })"/>
                </div>
              </app-field>
              <div></div>
            </div>
            <div class="row row--3">
              <app-field label="Jak często pobierana jest opłata?" num="8a">
                <app-select [options]="['jednorazowo','co rok','co miesiąc']"
                  [value]="c.freq" (valueChange)="calc.updateExtraCost(c.id, { freq: $any($event) })"/>
              </app-field>
              <app-field label="Jak wyliczana jest opłata?" num="8b">
                <app-select [options]="['% kwoty kredytu','% salda kredytu','znam kwotę']"
                  [value]="c.mode" (valueChange)="calc.updateExtraCost(c.id, { mode: $any($event) })"/>
              </app-field>
              <app-field [label]="c.mode === 'znam kwotę' ? 'Kwota' : 'Wartość'">
                <app-number-input [value]="c.value"
                  (valueChange)="calc.updateExtraCost(c.id, { value: $event })"
                  [suffix]="c.mode === 'znam kwotę' ? 'zł' : '%'" [decimals]="2"/>
              </app-field>
            </div>
            <div class="row row--2">
              <app-field label="Okres ponoszenia kosztu — Od" num="8c">
                <app-month-picker [value]="c.from"/>
              </app-field>
              <div></div>
            </div>
          </div>
        }
        <button class="btn btn--add" (click)="calc.addExtraCost()">＋ Dodaj koszt</button>
        </div>
      </div>

      <!-- 9. Promocyjna wysokość oprocentowania -->
      <div class="cost-sub cost-sub--acc" [class.is-open]="openCostSub() === 9" [class.is-closed]="openCostSub() !== 9">
        <button type="button" class="cost-sub-head" (click)="toggleCostSub(9)" [attr.aria-expanded]="openCostSub() === 9"><span class="cost-sub-num">9</span><span class="cost-sub-title">Promocyjna wysokość oprocentowania</span><svg class="cost-sub-chev" width="10" height="10" viewBox="0 0 10 10"><path d="M3 1 L7 5 L3 9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <div class="cost-sub-body">
        <div class="row row--3">
          <app-field label="Bank obniża oprocentowanie o">
            <app-number-input [value]="calc.promoRate()" (valueChange)="calc.promoRate.set($event)"
              suffix="%" [decimals]="2"/>
          </app-field>
          <app-field label="Od">
            <app-month-picker [value]="calc.promoFrom()"/>
          </app-field>
          <app-field label="do">
            <app-month-picker [value]="calc.promoTo()"/>
          </app-field>
        </div>
        </div>
      </div>

    </app-section>
  `,
})
export class CostsComponent {
  calc = inject(CalcService);
  /** Akordeon — jednocześnie tylko jedna podsekcja otwarta. null = wszystkie zamknięte. */
  openCostSub = signal<number | null>(1);
  toggleCostSub(n: number) { this.openCostSub.update(c => c === n ? null : n); }
  commissionPln = computed(() => this.calc.commissionPct() / 100 * this.calc.loanAmount());
}
