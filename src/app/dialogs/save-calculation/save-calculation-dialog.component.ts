import { Component, ElementRef, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-save-calculation-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './save-calculation-dialog.component.html',
  styleUrl: './save-calculation-dialog.component.scss',
})
export class SaveCalculationDialogComponent {
  private dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');

  nameCtrl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  private resolve?: (value: string | null) => void;
  private resolvedValue: string | null = null;

  open(defaultName = ''): Promise<string | null> {
    this.nameCtrl.reset(defaultName);
    this.resolvedValue = null;
    this.dialogEl().nativeElement.showModal();
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  onSave() {
    if (this.nameCtrl.invalid) return;
    const name = this.nameCtrl.value.trim();
    if (!name) return;
    this.resolvedValue = name;
    this.dialogEl().nativeElement.close();
  }

  onCancel() {
    this.dialogEl().nativeElement.close();
  }

  onClose() {
    this.resolve?.(this.resolvedValue);
    this.resolve = undefined;
    this.resolvedValue = null;
  }
}
