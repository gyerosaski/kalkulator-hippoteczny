import { ChangeDetectionStrategy, Component, inject, NgZone, viewChild } from '@angular/core';
import { ask as askDialog, message as messageDialog } from '@tauri-apps/plugin-dialog';

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
  private formService = inject(FormService);
  private schemaValidator = inject(SchemaValidatorService);
  protected themeService = inject(ThemeService);
  private calculationsStore = inject(CalculationsStoreService);
  private ngZone = inject(NgZone);
  private saveDialog = viewChild.required(SaveCalculationDialogComponent);
  private validationErrorDialog = viewChild.required(LoadValidationErrorDialogComponent);

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

    if (await this.calculationsStore.hasCalculation(name)) {
      const overwrite = await askDialog(
        `Istnieje już kalkulacja o nazwie "${name}". Czy chcesz ją nadpisać?`,
        { title: 'Nadpisać kalkulację?', kind: 'warning' },
      );
      if (!overwrite) return;
    }

    const data = this.formService.form.getRawValue();
    const record = { name, createdAt: new Date().toISOString(), data };
    await this.calculationsStore.saveCalculation(record);
    await this.calculationsStore.exportToFile(record);
  }
}
