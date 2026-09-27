import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DialogSize, ExportFormat, ExportScope, ExportSelection } from '../../model';
import { AbstractDialog } from '../../components/ui/dialog/abstract-dialog';
import { DialogComponent } from '../../components/ui/dialog/dialog.component';
import { FieldComponent } from '../../components/ui/field/field.component';
import { SegmentedComponent } from '../../components/ui/segmented/segmented.component';
import { ExportScopeLabelPipe } from '../../pipes/export-scope-label/export-scope-label.pipe';
import { ExportFormatLabelPipe } from '../../pipes/export-format-label/export-format-label.pipe';

@Component({
  selector: 'app-export-calculation-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogComponent,
    FieldComponent,
    SegmentedComponent,
    ReactiveFormsModule,
    ExportScopeLabelPipe,
    ExportFormatLabelPipe,
  ],
  templateUrl: './export-calculation-dialog.component.html',
  styleUrl: './export-calculation-dialog.component.scss',
})
export class ExportCalculationDialogComponent extends AbstractDialog<ExportSelection | null> {
  protected readonly dialog = viewChild.required(DialogComponent);
  protected readonly DialogSize = DialogSize;

  protected readonly exportScopes = Object.values(ExportScope);

  protected readonly scopeControl = new FormControl<ExportScope>(ExportScope.PARAMETERS, {
    nonNullable: true,
  });

  protected readonly formatControl = new FormControl<ExportFormat>(ExportFormat.JSON, {
    nonNullable: true,
  });

  private readonly selectedScope = signal(ExportScope.PARAMETERS);

  /** Parametry kalkulacji można eksportować wyłącznie do JSON; harmonogram do JSON lub CSV. */
  protected readonly formatOptions = computed(() =>
    this.selectedScope() === ExportScope.PARAMETERS
      ? [ExportFormat.JSON]
      : Object.values(ExportFormat),
  );

  constructor() {
    super();
    this.scopeControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((scope) => this.applyScope(scope));
  }

  open(): Promise<ExportSelection | null> {
    this.scopeControl.setValue(ExportScope.PARAMETERS);
    this.applyScope(ExportScope.PARAMETERS);
    return this.beginInteraction(null);
  }

  protected onConfirm(): void {
    this.closeWith({
      scope: this.scopeControl.value,
      format: this.formatControl.value,
    });
  }

  private applyScope(scope: ExportScope): void {
    this.selectedScope.set(scope);
    if (scope === ExportScope.PARAMETERS) {
      this.formatControl.setValue(ExportFormat.JSON);
    }
  }
}
