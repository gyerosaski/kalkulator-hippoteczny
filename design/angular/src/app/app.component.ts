import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalcService } from './calc.service';
import { BasicDataComponent } from './sections/basic-data.component';
import { CostsComponent } from './sections/costs.component';
import { TranchesComponent } from './sections/tranches.component';
import { OverpaymentsComponent } from './sections/overpayments.component';
import { KpiStripComponent } from './results/kpi-strip.component';
import { PaymentStructureComponent } from './results/payment-structure.component';
import { FirstInstallmentComponent } from './results/first-installment.component';
import { TrendChartComponent } from './results/trend-chart.component';
import { ScheduleTableComponent } from './results/schedule-table.component';
import { TweaksPanelComponent } from './tweaks/tweaks-panel.component';
import { ErrorsPanelComponent } from './results/errors-panel.component';
import { FormError } from './models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    BasicDataComponent,
    CostsComponent,
    TranchesComponent,
    OverpaymentsComponent,
    KpiStripComponent,
    PaymentStructureComponent,
    FirstInstallmentComponent,
    TrendChartComponent,
    ScheduleTableComponent,
    TweaksPanelComponent,
    ErrorsPanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="app"
      [attr.data-palette]="calc.tweaks().palette"
      [attr.data-density]="calc.tweaks().density"
      [attr.data-font]="calc.tweaks().fontPair"
    >
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="5" fill="var(--accent-sage-deep)" />
              <path
                d="M8 12 L11 15 L16 9"
                stroke="white"
                stroke-width="2"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <div>
            <div class="brand-name">Kalkulator hipoteczny</div>
            <div class="brand-sub">2.0 · pl-PL</div>
          </div>
        </div>
        <nav class="tabs">
          <button class="tab is-on">Kalkulator</button>
          <button class="tab">Twoje kalkulacje</button>
          <button class="tab">Porównanie ofert</button>
          <button class="tab">Słownik</button>
        </nav>
        <div class="topbar-actions">
          <button class="btn btn--ghost"><span class="ico">↻</span>Wstaw domyślne</button>
          <button class="btn btn--ghost">Wyczyść</button>
          <button class="btn btn--primary">Zapisz kalkulację</button>
        </div>
      </header>

      <main class="grid">
        <div class="col col--form">
          <app-basic-data />
          <app-costs />
          <app-tranches />
          <app-overpayments />
        </div>
        <div class="col col--results">
          @if (calc.showErrors()) {
            <app-errors-panel [errors]="calc.errors()" (goto)="handleGoto($event)" />
          } @else {
            <app-kpi-strip />
            <div class="result-grid">
              <app-payment-structure />
              <app-first-installment />
            </div>
            <app-trend-chart />
            <app-schedule-table />
          }
        </div>
      </main>

      <app-tweaks-panel />
    </div>
  `,
})
export class AppComponent {
  calc = inject(CalcService);

  handleGoto(err: FormError) {
    const el = document.getElementById(err.fieldId);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top, behavior: 'smooth' });
    el.classList.add('field--err-target');
    setTimeout(() => el.classList.remove('field--err-target'), 2400);
  }
}
