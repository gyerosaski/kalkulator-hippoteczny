import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  NgZone,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { ask as askDialog } from '@tauri-apps/plugin-dialog';

import { SavedCalculationMetadata, SavedCalculationRecord } from '../../model';
import {
  SavedCalculation,
  SavedCalculationFilterTab,
  SavedCalculationSortOption,
} from '../../model';
import { CalculationsStoreService } from '../../services/calculations-store/calculations-store.service';
import { CalculatorStateService } from '../../services/calculator-state/calculator-state.service';
import { SaveCalculationDialogComponent } from '../../dialogs/save-calculation/save-calculation-dialog.component';
import { FormService } from '../../services/form/form';
import {
  SavedCalculationsStateService,
  toSavedCalculation,
} from '../../services/saved-calculations-state/saved-calculations-state.service';
import { RelativeTimePipe } from '../../pipes/relative-time/relative-time.pipe';
import { CalculationsListComponent } from '../../components/calculations/calculations-list/calculations-list.component';
import { IconPlusComponent } from '../../components/icons/icon-plus/icon-plus.component';
import { IconDownloadComponent } from '../../components/icons/icon-download/icon-download.component';
import { IconCompareComponent } from '../../components/icons/icon-compare/icon-compare.component';
import { IconSearchComponent } from '../../components/icons/icon-search/icon-search.component';
import { IconTrashComponent } from '../../components/icons/icon-trash/icon-trash.component';

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
    RelativeTimePipe,
    CalculationsListComponent,
    SaveCalculationDialogComponent,
    IconPlusComponent,
    IconDownloadComponent,
    IconCompareComponent,
    IconSearchComponent,
    IconTrashComponent,
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

  protected readonly filterOptions: { id: SavedCalculationFilterTab; label: string }[] = [
    { id: SavedCalculationFilterTab.ALL, label: 'Wszystkie' },
    { id: SavedCalculationFilterTab.WORK, label: 'Robocze' },
  ];

  protected readonly sortOptions: { value: SavedCalculationSortOption; label: string }[] = [
    { value: SavedCalculationSortOption.UPDATED, label: 'ostatnio zmodyfikowane' },
    { value: SavedCalculationSortOption.CREATED, label: 'data utworzenia' },
    { value: SavedCalculationSortOption.NAME, label: 'nazwa (A–Z)' },
    { value: SavedCalculationSortOption.LOAN_AMOUNT, label: 'kwota kredytu' },
    { value: SavedCalculationSortOption.FIRST_INSTALLMENT, label: 'wysokość raty' },
  ];

  readonly searchQuery = signal('');
  readonly activeFilterTab = signal<SavedCalculationFilterTab>(SavedCalculationFilterTab.ALL);
  readonly activeSortOption = signal<SavedCalculationSortOption>(
    SavedCalculationSortOption.UPDATED,
  );

  readonly renameTarget = signal<SavedCalculation | null>(null);
  readonly renameValue = signal('');
  readonly deleteTarget = signal<SavedCalculation | null>(null);
  readonly toastMessage = signal<string | null>(null);
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly calculations = computed(() =>
    this.savedCalculationsStateService.records().map(toSavedCalculation),
  );

  readonly stats = computed(() => {
    const items = this.calculations();
    const lastUpdated = items.reduce(
      (max, item) => (item.updatedAt > max ? item.updatedAt : max),
      new Date(0),
    );
    return {
      total: items.length,
      work: items.length,
      lastUpdatedRelative: items.length ? lastUpdated : null,
    };
  });

  readonly filteredCalculations = computed(() => {
    let items = this.calculations();
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      items = items.filter((item) => item.name.toLowerCase().includes(query));
    }
    return [...items].sort(SORT_COMPARATORS[this.activeSortOption()]);
  });

  readonly hasActiveFilter = computed(
    () => !!this.searchQuery() || this.activeFilterTab() !== SavedCalculationFilterTab.ALL,
  );

  readonly activeCalculationName = computed(() => this.formService.loadedCalculationName());

  filterCount(tab: SavedCalculationFilterTab): number {
    const items = this.calculations();
    if (tab === SavedCalculationFilterTab.ALL) return items.length;
    return 0;
  }

  async ngOnInit(): Promise<void> {
    await this.savedCalculationsStateService.loadAll();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.renameTarget()) {
      this.renameTarget.set(null);
    } else if (this.deleteTarget()) {
      this.deleteTarget.set(null);
    }
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

  startRename(calculation: SavedCalculation): void {
    this.renameValue.set(calculation.name);
    this.renameTarget.set(calculation);
  }

  async confirmRename(): Promise<void> {
    const target = this.renameTarget();
    const newName = this.renameValue().trim();
    if (!target || !newName || newName === target.name) return;
    await this.savedCalculationsStateService.rename(target.name, newName);
    if (this.formService.loadedCalculationName() === target.name) {
      this.formService.loadedCalculationName.set(newName);
    }
    this.showToast(`Zmieniono nazwę na „${newName}"`);
    this.renameTarget.set(null);
  }

  startDelete(calculation: SavedCalculation): void {
    this.deleteTarget.set(calculation);
  }

  async confirmDelete(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) return;
    await this.savedCalculationsStateService.remove(target.name);
    if (this.formService.loadedCalculationName() === target.name) {
      this.formService.loadedCalculationName.set(null);
    }
    this.showToast(`Usunięto kalkulację „${target.name}"`);
    this.deleteTarget.set(null);
  }

  async duplicateCalculation(calculation: SavedCalculation): Promise<void> {
    const copyName = await this.savedCalculationsStateService.duplicate(calculation.name);
    if (copyName) {
      this.showToast(`Utworzono kopię „${copyName}"`);
    }
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.activeFilterTab.set(SavedCalculationFilterTab.ALL);
  }

  async navigateToNewCalculation(): Promise<void> {
    this.formService.setDefaults();
    await this.router.navigate(['']);
  }

  async importFromFile(): Promise<void> {
    await this.savedCalculationsStateService.importFromFile();
    this.showToast('Zaimportowano kalkulację');
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
    this.showToast(`Zapisano nową kalkulację „${name}"`);
  }

  formatWholeAmount(value: number): string {
    return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(value);
  }

  formatPercent(value: number, decimals = 2): string {
    return new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  formatExactDate(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    if (this.toastTimeoutId !== null) clearTimeout(this.toastTimeoutId);
    this.toastTimeoutId = setTimeout(() => this.toastMessage.set(null), 3200);
  }
}
