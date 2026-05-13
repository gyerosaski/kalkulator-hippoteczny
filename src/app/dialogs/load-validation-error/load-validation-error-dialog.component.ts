import { Component, ElementRef, viewChild } from '@angular/core';
import { ValidationError } from '../../services/schema-validator/schema-validator.service';

@Component({
  selector: 'app-load-validation-error-dialog',
  standalone: true,
  imports: [],
  templateUrl: './load-validation-error-dialog.component.html',
  styleUrl: './load-validation-error-dialog.component.scss',
})
export class LoadValidationErrorDialogComponent {
  private dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');

  protected errors: ValidationError[] = [];

  private resolve?: () => void;

  open(errors: ValidationError[]): Promise<void> {
    this.errors = errors;
    this.dialogEl().nativeElement.showModal();
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  close() {
    this.dialogEl().nativeElement.close();
  }

  onClose() {
    this.resolve?.();
    this.resolve = undefined;
  }
}
