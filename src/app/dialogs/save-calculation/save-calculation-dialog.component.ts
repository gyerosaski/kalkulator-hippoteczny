import { Component, inject } from '@angular/core';

import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

interface DialogData {
  defaultName?: string;
}

@Component({
  selector: 'app-save-calculation-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './save-calculation-dialog.component.html',
})
export class SaveCalculationDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<SaveCalculationDialogComponent>);
  private readonly data = inject<DialogData | null>(MAT_DIALOG_DATA, { optional: true }) ?? {};

  nameCtrl = new FormControl(this.data.defaultName ?? '', {
    nonNullable: true,
    validators: [Validators.required],
  });

  onSave() {
    if (this.nameCtrl.invalid) return;
    const name = this.nameCtrl.value.trim();
    if (!name) return;
    this.dialogRef.close(name);
  }
}
