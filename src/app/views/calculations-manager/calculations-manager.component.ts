import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  NgZone,
  OnInit,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { confirmDialog } from '../../services/platform/platform-dialog';

import {
  AppRoute,
  CalculationImportStatus,
  ExportFormat,
  ExportScope,
  OverheadCostKind,
  SavedCalculationMetadata,
  SavedCalculationRecord,
  SortDirection,
  ToastVariant,
} from '../../model';
import { SavedCalculation, SavedCalculationSortOption } from '../../model';
import { sortSavedCalculations } from '../../helpers/saved-calculation-sort.helper';
import { UiStateService } from '../../services/ui-state/ui-state.service';
import { CalculationsStoreService } from '../../services/calculations-store/calculations-store.service';
import { CalculatorStateService } from '../../services/calculator-state/calculator-state.service';
import { CalculatorService } from '../../services/calculator/calculator.service';
import { buildMortgageInputs } from '../../helpers/mortgage-inputs.helper';
import { normalizeCalculationData } from '../../helpers/saved-calculation-data.helper';
import { buildScheduleCsv } from '../../helpers/csv-export.helper';
import { SaveCalculationDialogComponent } from '../../dialogs/save-calculation/save-calculation-dialog.component';
import { RenameCalculationDialogComponent } from '../../dialogs/rename-calculation/rename-calculation-dialog.component';
import { DeleteCalculationDialogComponent } from '../../dialogs/delete-calculation/delete-calculation-dialog.component';
import { ExportCalculationDialogComponent } from '../../dialogs/export-calculation/export-calculation-dialog.component';
import { FormService } from '../../services/form/form';
import {
  SavedCalculationsStateService,
  toSavedCalculation,
} from '../../services/saved-calculations-state/saved-calculations-state.service';
import { CalculationsListComponent } from '../../components/calculations/calculations-list/calculations-list.component';
import { SelectComponent } from '../../components/ui/select/select.component';
import { IconPlusComponent } from '../../components/icons/icon-plus/icon-plus.component';
import { IconDownloadComponent } from '../../components/icons/icon-download/icon-download.component';
import { IconSearchComponent } from '../../components/icons/icon-search/icon-search.component';
import { IconArrowUpComponent } from '../../components/icons/icon-arrow-up/icon-arrow-up.component';
import { CalculationsFooterComponent } from '../../components/calculations/calculations-footer/calculations-footer.component';
import { RelativeTimePipe } from '../../pipes/relative-time/relative-time.pipe';
import { ToastService } from '../../services/toast/toast.service';
import {IconSaveComponent} from '../../components/icons/icon-save/icon-save.component';

@Component({
  selector: 'app-calculations-manager',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calculations-manager.component.html',
  styleUrl: './calculations-manager.component.scss',
  host: { '(scroll)': 'onScroll()' },
  imports: [
    ReactiveFormsModule,
    CalculationsListComponent,
    SelectComponent,
    SaveCalculationDialogComponent,
    RenameCalculationDialogComponent,
    DeleteCalculationDialogComponent,
    ExportCalculationDialogComponent,
    IconPlusComponent,
    IconDownloadComponent,
    IconSearchComponent,
    IconArrowUpComponent,
    CalculationsFooterComponent,
    RelativeTimePipe,
    IconSaveComponent,
  ],
})
export class CalculationsManagerComponent implements OnInit {
  private readonly savedCalculationsStateService = inject(SavedCalculationsStateService);
  private readonly uiStateService = inject(UiStateService);
  private readonly calculationsStore = inject(CalculationsStoreService);
  private readonly calculatorState = inject(CalculatorStateService);
  private readonly calculatorService = inject(CalculatorService);
  private readonly formService = inject(FormService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly toastService = inject(ToastService);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly saveDialog = viewChild.required(SaveCalculationDialogComponent);
  private readonly renameDialog = viewChild.required(RenameCalculationDialogComponent);
  private readonly deleteDialog = viewChild.required(DeleteCalculationDialogComponent);
  private readonly exportDialog = viewChild.required(ExportCalculationDialogComponent);

  private readonly sortOptions: { value: SavedCalculationSortOption; label: string }[] = [
    { value: SavedCalculationSortOption.UPDATED, label: 'ostatnio zmodyfikowane' },
    { value: SavedCalculationSortOption.CREATED, label: 'data utworzenia' },
    { value: SavedCalculationSortOption.NAME, label: 'nazwa' },
    { value: SavedCalculationSortOption.LOAN_AMOUNT, label: 'kwota kredytu' },
    { value: SavedCalculationSortOption.FIRST_INSTALLMENT, label: 'wysokość raty' },
  ];

  protected readonly sortOptionValues = this.sortOptions.map((option) => option.value);
  protected readonly sortOptionLabels = this.sortOptions.map((option) => option.label);

  readonly searchQuery = signal('');
  readonly activeSortControl = new FormControl<SavedCalculationSortOption>(
    this.uiStateService.savedCalculationsSortOption(),
    { nonNullable: true },
  );

  protected readonly sortDirection = this.uiStateService.savedCalculationsSortDirection;
  protected readonly SortDirection = SortDirection;
  protected readonly isAnimatable = signal(false);

  constructor() {
    this.activeSortControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((sortOption) => this.uiStateService.setSavedCalculationsSortOption(sortOption));

    afterNextRender(() => {
      this.hostElement.nativeElement.scrollTop = this.uiStateService.calculationsManagerScrollTop();
    });

    afterNextRender(() => this.isAnimatable.set(true));
  }

  protected onScroll(): void {
    this.uiStateService.setCalculationsManagerScrollTop(this.hostElement.nativeElement.scrollTop);
  }

  protected readonly storePathResource = resource({
    loader: () => this.calculationsStore.getStorePath(),
  });

  readonly calculations = computed(() =>
    this.savedCalculationsStateService.records().map(toSavedCalculation),
  );

  readonly lastUpdatedAt = computed<Date | null>(() => {
    const items = this.calculations();
    if (!items.length) return null;
    return items.reduce(
      (latest, item) => (item.updatedAt > latest ? item.updatedAt : latest),
      items[0].updatedAt,
    );
  });

  readonly filteredCalculations = computed(() => {
    let items = this.calculations();
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      items = items.filter((item) => item.name.toLowerCase().includes(query));
    }
    return sortSavedCalculations(
      items,
      this.uiStateService.savedCalculationsSortOption(),
      this.uiStateService.savedCalculationsSortDirection(),
    );
  });

  toggleSortDirection(): void {
    this.uiStateService.toggleSavedCalculationsSortDirection();
  }

  readonly hasActiveFilter = computed(() => !!this.searchQuery());

  readonly activeCalculationName = computed(() => this.formService.loadedCalculationName());
  readonly isLoadedCalculationModified = computed(() =>
    this.formService.isLoadedCalculationModified(),
  );

  async ngOnInit(): Promise<void> {
    await this.savedCalculationsStateService.loadAll();
  }

  async loadCalculation(calculation: SavedCalculation): Promise<void> {
    const record = this.savedCalculationsStateService
      .records()
      .find((record) => record.name === calculation.name);
    if (!record) return;
    this.ngZone.run(() => {
      this.formService.loadFromSavedCalculation(record.data, calculation.name);
    });
    await this.router.navigate([AppRoute.CALCULATOR]);
    this.toastService.show(`Wczytano kalkulację „${calculation.name}"`);
  }

  async startRename(calculation: SavedCalculation): Promise<void> {
    const newName = await this.renameDialog().open(calculation.name);
    if (!newName || newName === calculation.name) return;
    await this.savedCalculationsStateService.rename(calculation.name, newName);
    if (this.formService.loadedCalculationName() === calculation.name) {
      this.formService.loadedCalculationName.set(newName);
    }
    this.toastService.show(`Zmieniono nazwę na „${newName}"`);
  }

  async startDelete(calculation: SavedCalculation): Promise<void> {
    const confirmed = await this.deleteDialog().open(calculation);
    if (!confirmed) return;
    await this.savedCalculationsStateService.remove(calculation.name);
    if (this.formService.loadedCalculationName() === calculation.name) {
      this.formService.loadedCalculationName.set(null);
    }
    this.toastService.show(`Usunięto kalkulację „${calculation.name}"`);
  }

  async duplicateCalculation(calculation: SavedCalculation): Promise<void> {
    const copyName = await this.savedCalculationsStateService.duplicate(calculation.name);
    if (copyName) {
      this.toastService.show(`Utworzono kopię „${copyName}"`);
    }
  }

  clearFilters(): void {
    this.searchQuery.set('');
  }

  async navigateToNewCalculation(): Promise<void> {
    this.formService.setDefaults();
    await this.router.navigate(['']);
  }

  async importFromFile(): Promise<void> {
    const { status, importedCount } = await this.savedCalculationsStateService.importFromFile();
    if (status === CalculationImportStatus.SUCCESS) {
      const message =
        importedCount === 1
          ? 'Zaimportowano kalkulację'
          : `Zaimportowano ${importedCount} kalkulacji`;
      this.toastService.show(message);
    } else if (status === CalculationImportStatus.INVALID_FILE) {
      this.toastService.show('Nieprawidłowy plik kalkulacji', ToastVariant.ERROR);
    }
  }

  async exportAll(): Promise<void> {
    const records = this.savedCalculationsStateService.records();
    const savedPath = await this.calculationsStore.exportAllToFile(records);
    if (savedPath) {
      this.toastService.show(`Wyeksportowano ${records.length} kalkulacji`);
    }
  }

  async exportCalculation(calculation: SavedCalculation): Promise<void> {
    const record = this.savedCalculationsStateService
      .records()
      .find((existing) => existing.name === calculation.name);
    if (!record) return;

    const selection = await this.exportDialog().open();
    if (!selection) return;

    if (selection.scope === ExportScope.PARAMETERS) {
      const savedPath = await this.calculationsStore.exportToFile(record);
      if (savedPath) {
        this.toastService.show(`Wyeksportowano kalkulację „${calculation.name}"`);
      }
      return;
    }

    const formValue = normalizeCalculationData(record.data);
    if (!formValue) {
      this.toastService.show('Nie udało się przeliczyć harmonogramu', ToastVariant.ERROR);
      return;
    }
    const results = this.calculatorService.compute(buildMortgageInputs(formValue));

    const savedPath =
      selection.format === ExportFormat.CSV
        ? await this.calculationsStore.exportCsvToFile(
            `${calculation.name}.csv`,
            buildScheduleCsv(results.schedule),
            'Zapisz harmonogram do pliku CSV',
          )
        : await this.calculationsStore.exportJsonToFile(
            `${calculation.name}.json`,
            JSON.stringify(results.schedule, null, 2),
            'Zapisz harmonogram do pliku JSON',
          );
    if (savedPath) {
      this.toastService.show(`Wyeksportowano kalkulację „${calculation.name}"`);
    }
  }

  async saveCurrentCalculation(calculation: SavedCalculation): Promise<void> {
    const existingRecord = this.savedCalculationsStateService
      .records()
      .find((record) => record.name === calculation.name);
    if (!existingRecord) return;

    const formData = this.formService.form.getRawValue();
    const results = this.calculatorState.results();
    const now = new Date().toISOString();

    const metadata: SavedCalculationMetadata | undefined = results
      ? {
          firstInstallment: results.firstInstallment?.rate ?? 0,
          totalInterest: results.totals.totalInterest,
          totalCosts: results.totals.overheadCosts,
          commission: results.totals.overheadCostsBreakdown
            .filter((item) => item.kind === OverheadCostKind.LOAN_COMMISSION)
            .reduce((sum, item) => sum + item.value, 0),
          appraisalFee: results.totals.overheadCostsBreakdown
            .filter((item) => item.kind === OverheadCostKind.APPRAISAL_FEE)
            .reduce((sum, item) => sum + item.value, 0),
          totalOverpayments: results.totals.prepayments,
          totalPayments: results.totals.totalAllPayments,
          overpaymentsEnabled: formData.prepayments.enabled,
          trancheCount: formData.tranches.enabled
            ? ((formData.tranches.fields.tranches as unknown[])?.length ?? 1)
            : 1,
          hasErrors: this.formService.form.invalid,
        }
      : undefined;

    const updatedRecord: SavedCalculationRecord = {
      ...existingRecord,
      updatedAt: now,
      metadata,
      data: formData,
    };

    await this.calculationsStore.saveCalculation(updatedRecord);
    await this.savedCalculationsStateService.refreshRecords();
    this.formService.refreshLoadedCalculationSnapshot();
    this.toastService.show(`Zapisano zmiany w „${calculation.name}"`);
  }

  async saveAsNewCalculation(): Promise<void> {
    const defaultName = 'Kalkulacja ' + new Date().toLocaleDateString('pl-PL');
    const name = await this.saveDialog().open(defaultName);
    if (!name) return;

    const existingRecords = await this.calculationsStore.listCalculations();
    const existingRecord = existingRecords.find((record) => record.name === name);

    if (existingRecord) {
      const overwrite = await confirmDialog(
        `Istnieje już kalkulacja o nazwie "${name}". Czy chcesz ją nadpisać?`,
        { title: 'Nadpisać kalkulację?', kind: 'warning' },
      );
      if (!overwrite) return;
    }

    const formData = this.formService.form.getRawValue();
    const results = this.calculatorState.results();
    const now = new Date().toISOString();

    const metadata: SavedCalculationMetadata | undefined = results
      ? {
          firstInstallment: results.firstInstallment?.rate ?? 0,
          totalInterest: results.totals.totalInterest,
          totalCosts: results.totals.overheadCosts,
          commission: results.totals.overheadCostsBreakdown
            .filter((item) => item.kind === OverheadCostKind.LOAN_COMMISSION)
            .reduce((sum, item) => sum + item.value, 0),
          appraisalFee: results.totals.overheadCostsBreakdown
            .filter((item) => item.kind === OverheadCostKind.APPRAISAL_FEE)
            .reduce((sum, item) => sum + item.value, 0),
          totalOverpayments: results.totals.prepayments,
          totalPayments: results.totals.totalAllPayments,
          overpaymentsEnabled: formData.prepayments.enabled,
          trancheCount: formData.tranches.enabled
            ? ((formData.tranches.fields.tranches as unknown[])?.length ?? 1)
            : 1,
          hasErrors: this.formService.form.invalid,
        }
      : undefined;

    const record: SavedCalculationRecord = {
      name,
      createdAt: existingRecord?.createdAt ?? now,
      updatedAt: now,
      metadata,
      data: formData,
    };

    await this.calculationsStore.saveCalculation(record);
    await this.savedCalculationsStateService.refreshRecords();
    if (name === this.formService.loadedCalculationName()) {
      this.formService.refreshLoadedCalculationSnapshot();
    }
    this.toastService.show(`Zapisano nową kalkulację „${name}"`);
  }
}
