import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { MortgageResults, YearGroup } from '../../model';
import { CalculatorService } from '../../services/calculator/calculator.service';
import { CalculatorStateService } from '../../services/calculator-state/calculator-state.service';
import { FormService } from '../../services/form/form';
import { UiStateService } from '../../services/ui-state/ui-state.service';
import { BasicDataFormComponent } from '../../components/form/basic-data-form/basic-data-form.component';
import { RatePeriodsFormComponent } from '../../components/form/rate-periods-form/rate-periods-form.component';
import { OverheadCostsFormComponent } from '../../components/form/overhead-costs-form/overhead-costs-form.component';
import { TranchesFormComponent } from '../../components/form/tranches-form/tranches-form.component';
import { PrepaymentsFormComponent } from '../../components/form/prepayments-form/prepayments-form.component';
import { ResultsDonutChartTotalComponent } from '../../components/results/results-donut-chart-total/results-donut-chart-total.component';
import { ResultsDonutChartInstallmentComponent } from '../../components/results/results-donut-chart-installment/results-donut-chart-installment.component';
import { ResultsTrendChartComponent } from '../../components/results/results-trend-chart/results-trend-chart.component';
import { ResultsRateChartComponent } from '../../components/results/results-rate-chart/results-rate-chart.component';
import { ResultsScheduleComponent } from '../../components/results/results-schedule/results-schedule.component';
import { ResultsErrorsComponent } from '../../components/errors/results-errors/results-errors.component';
import { buildMortgageInputs } from '../../helpers/mortgage-inputs.helper';
import { groupByYear } from '../../helpers/year-group.helper';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    BasicDataFormComponent,
    RatePeriodsFormComponent,
    OverheadCostsFormComponent,
    TranchesFormComponent,
    PrepaymentsFormComponent,
    ResultsDonutChartTotalComponent,
    ResultsDonutChartInstallmentComponent,
    ResultsTrendChartComponent,
    ResultsRateChartComponent,
    ResultsScheduleComponent,
    ResultsErrorsComponent,
  ],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalculatorComponent {
  private readonly calc = inject(CalculatorService);
  private readonly formService = inject(FormService);
  private readonly calculatorState = inject(CalculatorStateService);
  private readonly uiStateService = inject(UiStateService);

  get form() {
    return this.formService.form;
  }

  readonly results = signal<MortgageResults | null>(null);
  readonly yearlyGroups = signal<YearGroup[] | null>(null);

  private readonly formColumn = viewChild<ElementRef<HTMLElement>>('formColumn');
  private readonly resultsColumn = viewChild<ElementRef<HTMLElement>>('resultsColumn');

  get loanAmount(): number | null {
    return this.formService.form.controls.basicData.controls.loanAmount.value ?? null;
  }

  get overheadCostsEnabled(): boolean {
    return this.formService.isOverheadCostsEnabled;
  }

  get prepaymentsEnabled(): boolean {
    return this.formService.isPrepaymentEnabled;
  }

  constructor() {
    this.recalculate();
    this.form.valueChanges
      .pipe(startWith(this.form.getRawValue()), takeUntilDestroyed())
      .subscribe(() => this.recalculate());

    afterNextRender(() => {
      const formElement = this.formColumn()?.nativeElement;
      if (formElement) {
        formElement.scrollTop = this.uiStateService.calculatorFormColumnScrollTop();
      }
      const resultsElement = this.resultsColumn()?.nativeElement;
      if (resultsElement) {
        resultsElement.scrollTop = this.uiStateService.calculatorResultsColumnScrollTop();
      }
    });
  }

  protected onFormColumnScroll(scrollTop: number): void {
    this.uiStateService.setCalculatorFormColumnScrollTop(scrollTop);
  }

  protected onResultsColumnScroll(scrollTop: number): void {
    this.uiStateService.setCalculatorResultsColumnScrollTop(scrollTop);
  }

  private recalculate() {
    if (this.form.valid) {
      const inputs = buildMortgageInputs(this.form.getRawValue());
      const computedResults = this.calc.compute(inputs);
      this.results.set(computedResults);
      this.yearlyGroups.set(groupByYear(computedResults.schedule));
      this.calculatorState.results.set(computedResults);
      this.uiStateService.clampSelectedMonth(computedResults.schedule.length);
    } else {
      this.results.set(null);
      this.yearlyGroups.set(null);
      this.calculatorState.results.set(null);
      this.uiStateService.clearSelectedMonth();
    }
  }
}
