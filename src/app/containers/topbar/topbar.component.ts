import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  NgZone,
  viewChild,
} from '@angular/core';

import { FormService } from '../../services/form/form';
import { SchemaValidatorService } from '../../services/schema-validator/schema-validator.service';
import { SaveCalculationDialogComponent } from '../../dialogs/save-calculation/save-calculation-dialog.component';
import { LoadValidationErrorDialogComponent } from '../../dialogs/load-validation-error/load-validation-error-dialog.component';
import { IconCalculatorComponent } from '../../components/icons/icon-calculator/icon-calculator.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    SaveCalculationDialogComponent,
    LoadValidationErrorDialogComponent,
    IconCalculatorComponent,
  ],
  templateUrl: './topbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  private formService = inject(FormService);
  private schemaValidator = inject(SchemaValidatorService);
  private ngZone = inject(NgZone);
  private saveDialog = viewChild.required(SaveCalculationDialogComponent);
  private validationErrorDialog = viewChild.required(LoadValidationErrorDialogComponent);
  private fileInputEl = viewChild.required<ElementRef<HTMLInputElement>>('fileInputEl');

  setDefaults() {
    this.formService.setDefaults();
    this.formService.setOverheadDefaults();
  }

  loadCalculationFromFile() {
    const el = this.fileInputEl().nativeElement;
    el.value = '';
    el.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        const formData = parsed?.data ?? parsed;
        const errors = this.schemaValidator.validate(formData);
        if (errors.length > 0) {
          this.ngZone.run(() => this.validationErrorDialog().open(errors));
          return;
        }
        this.ngZone.run(() => this.formService.loadFromFile(formData));
      } catch {
        window.alert(
          'Nie udało się wczytać pliku. Upewnij się, że to prawidłowy plik kalkulacji .json.',
        );
      }
    };
    reader.readAsText(file);
  }

  async saveCalculation() {
    const defaultName = 'Kalkulacja ' + new Date().toLocaleDateString('pl-PL');
    const name = await this.saveDialog().open(defaultName);
    if (!name) return;
    const data = this.formService.form.getRawValue();
    const all = JSON.parse(localStorage.getItem('kalkulacje') || '[]');
    const existingIdx = all.findIndex((x: any) => x.name === name);
    if (existingIdx >= 0) {
      const overwrite = window.confirm(
        `Istnieje już kalkulacja o nazwie "${name}". Czy chcesz ją nadpisać?`,
      );
      if (!overwrite) return;
    }
    const record = { name, createdAt: new Date().toISOString(), data };
    if (existingIdx >= 0) {
      all[existingIdx] = record;
    } else {
      all.push(record);
    }
    localStorage.setItem('kalkulacje', JSON.stringify(all));

    const fileName = this.sanitizeFileName(name) + '.json';
    this.downloadJsonFile(fileName, record);
  }

  private sanitizeFileName(name: string): string {
    const s = (name || '').replace(/[\\\/:*?"<>|]/g, '_').trim();
    return s || 'kalkulacja';
  }

  private downloadJsonFile(fileName: string, content: any): void {
    const json = JSON.stringify(content, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
