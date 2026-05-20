import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  NgZone,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ask as askDialog, message as messageDialog } from '@tauri-apps/plugin-dialog';

import { MortgageResults } from '../../model';
import {
  SavedCalculationMetadata,
  SavedCalculationRecord,
} from '../../model/saved-calculation.model';
import { FormService } from '../../services/form/form';
import { SchemaValidatorService } from '../../services/schema-validator/schema-validator.service';
import { ThemeService } from '../../services/theme/theme.service';
import { CalculationsStoreService } from '../../services/calculations-store/calculations-store.service';
import { SaveCalculationDialogComponent } from '../../dialogs/save-calculation/save-calculation-dialog.component';
import { LoadValidationErrorDialogComponent } from '../../dialogs/load-validation-error/load-validation-error-dialog.component';
import { IconCalculatorComponent } from '../../components/icons/icon-calculator/icon-calculator.component';
import { IconSunComponent } from '../../components/icons/icon-sun/icon-sun.component';
import { IconMoonComponent } from '../../components/icons/icon-moon/icon-moon.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    SaveCalculationDialogComponent,
    LoadValidationErrorDialogComponent,
    IconCalculatorComponent,
    IconSunComponent,
    IconMoonComponent,
  ],
  templateUrl: './topbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  private readonly formService = inject(FormService);
  private readonly schemaValidator = inject(SchemaValidatorService);
  protected readonly themeService = inject(ThemeService);
  private readonly calculationsStore = inject(CalculationsStoreService);
  private readonly ngZone = inject(NgZone);
  private readonly router = inject(Router);
  private readonly saveDialog = viewChild.required(SaveCalculationDialogComponent);
  private readonly validationErrorDialog = viewChild.required(LoadValidationErrorDialogComponent);

  readonly currentResults = input<MortgageResults | null>(null);

  private readonly routerUrl = toSignal(this.router.events.pipe(map(() => this.router.url)), {
    initialValue: this.router.url,
  });

  protected readonly isSavedTab = computed(() => this.routerUrl()?.startsWith('/saved') ?? false);

  navigateToCalculator(): void {
    this.router.navigate(['']);
  }

  navigateToSaved(): void {
    this.router.navigate(['saved']);
  }

  setDefaults() {
    this.formService.setDefaults();
  }

  async loadCalculationFromFile() {
    try {
      const result = await this.calculationsStore.importFromFile();
      if (!result) return;
      const formData = result.record?.data ?? result.rawData;
      const errors = this.schemaValidator.validate(formData);
      if (errors.length > 0) {
        this.ngZone.run(() => this.validationErrorDialog().open(errors));
        return;
      }
      this.ngZone.run(() => this.formService.loadFromFile(formData));
    } catch {
      await messageDialog(
        'Nie udało się wczytać pliku. Upewnij się, że to prawidłowy plik kalkulacji .json.',
        { title: 'Błąd wczytywania', kind: 'error' },
      );
    }
  }

  async saveCalculation() {
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
    const results = this.currentResults();
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
    await this.calculationsStore.exportToFile(record);
  }
}
