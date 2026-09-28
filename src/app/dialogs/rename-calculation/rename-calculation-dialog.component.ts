import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';

import { AbstractDialog } from '../../components/ui/dialog/abstract-dialog';
import { DialogComponent } from '../../components/ui/dialog/dialog.component';

@Component({
  selector: 'app-rename-calculation-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogComponent],
  templateUrl: './rename-calculation-dialog.component.html',
  styleUrl: './rename-calculation-dialog.component.scss',
})
export class RenameCalculationDialogComponent extends AbstractDialog<string | null> {
  protected readonly dialog = viewChild.required(DialogComponent);

  protected readonly originalName = signal('');
  protected readonly currentValue = signal('');
  private readonly takenNames = signal<ReadonlySet<string>>(new Set());

  /** Nowa nazwa jest już używana przez inną zapisaną kalkulację. */
  protected readonly isNameTaken = computed(() =>
    this.takenNames().has(this.currentValue().trim()),
  );

  /**
   * @param currentName bieżąca nazwa kalkulacji.
   * @param takenNames nazwy pozostałych zapisanych kalkulacji — nie można ich użyć.
   */
  open(currentName: string, takenNames: readonly string[] = []): Promise<string | null> {
    this.originalName.set(currentName);
    this.currentValue.set(currentName);
    this.takenNames.set(new Set(takenNames));
    return this.beginInteraction(null);
  }

  protected onInput(value: string): void {
    this.currentValue.set(value);
  }

  protected isConfirmDisabled(): boolean {
    const trimmed = this.currentValue().trim();
    return !trimmed || trimmed === this.originalName() || this.isNameTaken();
  }

  protected confirm(): void {
    if (this.isConfirmDisabled()) return;
    this.closeWith(this.currentValue().trim());
  }
}
