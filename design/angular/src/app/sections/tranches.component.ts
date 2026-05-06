import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CalcService } from '../calc.service';
import { SectionComponent } from '../ui/section.component';
import { FieldComponent } from '../ui/field.component';
import { NumberInputComponent } from '../ui/number-input.component';
import { MonthPickerComponent } from '../ui/month-picker.component';
import { PlnPipe } from '../pipes/pln.pipe';

@Component({
  selector: 'app-tranches',
  standalone: true,
  imports: [SectionComponent, FieldComponent, NumberInputComponent, MonthPickerComponent, PlnPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-section
      title="Transze"
      badge="1 transza"
      [defaultOpen]="false"
      [toggleable]="true"
      [enabled]="calc.tranchesEnabled()"
      (enabledChange)="calc.tranchesEnabled.set($event)"
    >
      <div class="tranche-row">
        <div class="tranche-num">1</div>
        <app-field label="Kwota">
          <app-number-input
            [value]="calc.loanAmount()"
            (valueChange)="(0)"
            suffix="zł"
            [decimals]="0"
            [disabled]="true"
          />
        </app-field>
        <app-field label="Data uruchomienia">
          <app-month-picker [value]="calc.startDate()" [disabled]="true" />
        </app-field>
        <button class="ico-btn" [disabled]="true">−</button>
      </div>
      <button class="btn btn--add">＋ Dodaj transzę</button>
      <div class="suma-row">
        <span class="muted">Suma transz</span>
        <span class="mono"
          ><b>{{ calc.loanAmount() | pln }}</b> zł</span
        >
      </div>
    </app-section>
  `,
})
export class TranchesComponent {
  calc = inject(CalcService);
}
