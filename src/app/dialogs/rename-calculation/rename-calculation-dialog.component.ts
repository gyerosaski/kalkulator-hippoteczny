import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';

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

  open(currentName: string): Promise<string | null> {
    this.originalName.set(currentName);
    this.currentValue.set(currentName);
    return this.beginInteraction(null);
  }

  protected onInput(value: string): void {
    this.currentValue.set(value);
  }

  protected isConfirmDisabled(): boolean {
    const trimmed = this.currentValue().trim();
    return !trimmed || trimmed === this.originalName();
  }

  protected confirm(): void {
    if (this.isConfirmDisabled()) return;
    this.closeWith(this.currentValue().trim());
  }
}
