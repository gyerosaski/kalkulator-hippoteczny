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
  template: `
    <h2 mat-dialog-title>Zapisz kalkulację</h2>
    <div mat-dialog-content>
      <mat-form-field appearance="fill" style="width: 100%;">
        <mat-label>Nazwa kalkulacji</mat-label>
        <input
          matInput
          [formControl]="nameCtrl"
          placeholder="np. Moja kalkulacja"
          (keydown.enter)="onSave()"
        />
        @if (nameCtrl.hasError('required')) {
          <mat-error>Nazwa jest wymagana.</mat-error>
        }
      </mat-form-field>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Anuluj</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="nameCtrl.invalid">
        Zapisz
      </button>
    </div>
  `,
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
