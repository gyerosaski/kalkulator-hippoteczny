import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  NgZone,
  OnInit,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ask as askDialog } from '@tauri-apps/plugin-dialog';

import { SavedCalculationMetadata, SavedCalculationRecord } from '../../model';
import { SavedCalculation, SavedCalculationSortOption } from '../../model';
import { CalculationsStoreService } from '../../services/calculations-store/calculations-store.service';
import { CalculatorStateService } from '../../services/calculator-state/calculator-state.service';
import { SaveCalculationDialogComponent } from '../../dialogs/save-calculation/save-calculation-dialog.component';
import { RenameCalculationDialogComponent } from '../../dialogs/rename-calculation/rename-calculation-dialog.component';
import { DeleteCalculationDialogComponent } from '../../dialogs/delete-calculation/delete-calculation-dialog.component';
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
import { IconCheckCircleComponent } from '../../components/icons/icon-check-circle/icon-check-circle.component';
import { CalculationsFooterComponent } from '../../components/calculations/calculations-footer/calculations-footer.component';

type SortComparator = (a: SavedCalculation, b: SavedCalculation) => number;

const SORT_COMPARATORS: Record<SavedCalculationSortOption, SortComparator> = {
  [SavedCalculationSortOption.UPDATED]: (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  [SavedCalculationSortOption.CREATED]: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  [SavedCalculationSortOption.NAME]: (a, b) => a.name.localeCompare(b.name, 'pl'),
  [SavedCalculationSortOption.LOAN_AMOUNT]: (a, b) => b.loanAmount - a.loanAmount,
  [SavedCalculationSortOption.FIRST_INSTALLMENT]: (a, b) => a.firstInstallment - b.firstInstallment,
};

@Component({
  selector: 'app-calculations-manager',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calculations-manager.component.html',
  styleUrl: './calculations-manager.component.scss',
  imports: [
    ReactiveFormsModule,
    CalculationsListComponent,
    SelectComponent,
    SaveCalculationDialogComponent,
    RenameCalculationDialogComponent,
    DeleteCalculationDialogComponent,
    IconPlusComponent,
    IconDownloadComponent,
    IconSearchComponent,
    IconCheckCircleComponent,
    CalculationsFooterComponent,
  ],
})
export class CalculationsManagerComponent implements OnInit {
  private readonly savedCalculationsStateService = inject(SavedCalculationsStateService);
  private readonly calculationsStore = inject(CalculationsStoreService);
  private readonly calculatorState = inject(CalculatorStateService);
  private readonly formService = inject(FormService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly saveDialog = viewChild.required(SaveCalculationDialogComponent);
  private readonly renameDialog = viewChild.required(RenameCalculationDialogComponent);
  private readonly deleteDialog = viewChild.required(DeleteCalculationDialogComponent);

  private readonly sortOptions: { value: SavedCalculationSortOption; label: string }[] = [
    { value: SavedCalculationSortOption.UPDATED, label: 'ostatnio zmodyfikowane' },
    { value: SavedCalculationSortOption.CREATED, label: 'data utworzenia' },
    { value: SavedCalculationSortOption.NAME, label: 'nazwa (A–Z)' },
    { value: SavedCalculationSortOption.LOAN_AMOUNT, label: 'kwota kredytu' },
    { value: SavedCalculationSortOption.FIRST_INSTALLMENT, label: 'wysokość raty' },
  ];

  protected readonly sortOptionValues = this.sortOptions.map((option) => option.value);
  protected readonly sortOptionLabels = this.sortOptions.map((option) => option.label);

  readonly searchQuery = signal('');
  readonly activeSortControl = new FormControl<SavedCalculationSortOption>(
    SavedCalculationSortOption.UPDATED,
    { nonNullable: true },
  );

  private readonly activeSortValue = toSignal(this.activeSortControl.valueChanges, {
    initialValue: SavedCalculationSortOption.UPDATED,
  });

  protected readonly storePathResource = resource({
    loader: () => this.calculationsStore.getStorePath(),
  });

  readonly toastMessage = signal<string | null>(null);
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly calculations = computed(() =>
    this.savedCalculationsStateService.records().map(toSavedCalculation),
  );

  readonly filteredCalculations = computed(() => {
    let items = this.calculations();
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      items = items.filter((item) => item.name.toLowerCase().includes(query));
    }
    return [...items].sort(SORT_COMPARATORS[this.activeSortValue()]);
  });

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
    await this.router.navigate(['']);
    this.showToast(`Wczytano „${calculation.name}" do kalkulatora`);
  }

  async startRename(calculation: SavedCalculation): Promise<void> {
    const newName = await this.renameDialog().open(calculation.name);
    if (!newName || newName === calculation.name) return;
    await this.savedCalculationsStateService.rename(calculation.name, newName);
    if (this.formService.loadedCalculationName() === calculation.name) {
      this.formService.loadedCalculationName.set(newName);
    }
    this.showToast(`Zmieniono nazwę na „${newName}"`);
  }

  async startDelete(calculation: SavedCalculation): Promise<void> {
    const confirmed = await this.deleteDialog().open(calculation);
    if (!confirmed) return;
    await this.savedCalculationsStateService.remove(calculation.name);
    if (this.formService.loadedCalculationName() === calculation.name) {
      this.formService.loadedCalculationName.set(null);
    }
    this.showToast(`Usunięto kalkulację „${calculation.name}"`);
  }

  async duplicateCalculation(calculation: SavedCalculation): Promise<void> {
    const copyName = await this.savedCalculationsStateService.duplicate(calculation.name);
    if (copyName) {
      this.showToast(`Utworzono kopię „${copyName}"`);
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
    await this.savedCalculationsStateService.importFromFile();
    this.showToast('Zaimportowano kalkulację');
  }

  async exportAllToFile(): Promise<void> {
    const records = this.savedCalculationsStateService.records();
    if (!records.length) {
      this.showToast('Brak kalkulacji do eksportu');
      return;
    }
    const savedPath = await this.calculationsStore.exportAllToFile(records);
    if (savedPath) {
      this.showToast(`Wyeksportowano ${records.length} kalkulacji`);
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
          overpaymentsEnabled: formData.prepayments.enabled,
          trancheCount: formData.tranches.enabled
            ? ((formData.tranches.fields.tranches as unknown[])?.length ?? 1)
            : 1,
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
    this.showToast(`Zapisano zmiany w „${calculation.name}"`);
  }

  async saveAsNewCalculation(): Promise<void> {
    const defaultName = 'Kalkulacja ' + new Date().toLocaleDateString('pl-PL');
    const name = await this.saveDialog().open(defaultName);
    if (!name) return;

    const existingRecords = await this.calculationsStore.listCalculations();
    const existingRecord = existingRecords.find((record) => record.name === name);

    if (existingRecord) {
      const overwrite = await askDialog(
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
          overpaymentsEnabled: formData.prepayments.enabled,
          trancheCount: formData.tranches.enabled
            ? ((formData.tranches.fields.tranches as unknown[])?.length ?? 1)
            : 1,
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
    this.showToast(`Zapisano nową kalkulację „${name}"`);
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    if (this.toastTimeoutId !== null) clearTimeout(this.toastTimeoutId);
    this.toastTimeoutId = setTimeout(() => this.toastMessage.set(null), 3200);
  }
}
