import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { DialogSize } from '../../model';
import { AbstractDialog } from '../../components/ui/dialog/abstract-dialog';
import { DialogComponent } from '../../components/ui/dialog/dialog.component';

@Component({
  selector: 'app-save-calculation-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogComponent, ReactiveFormsModule],
  templateUrl: './save-calculation-dialog.component.html',
  styleUrl: './save-calculation-dialog.component.scss',
})
export class SaveCalculationDialogComponent extends AbstractDialog<string | null> {
  protected readonly dialog = viewChild.required(DialogComponent);
  protected readonly DialogSize = DialogSize;

  protected readonly nameCtrl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  open(defaultName = ''): Promise<string | null> {
    this.nameCtrl.reset(defaultName);
    return this.beginInteraction(null);
  }

  protected onSave(): void {
    if (this.nameCtrl.invalid) return;
    const name = this.nameCtrl.value.trim();
    if (!name) return;
    this.closeWith(name);
  }
}
