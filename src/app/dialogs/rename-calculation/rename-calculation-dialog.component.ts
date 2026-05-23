import { ChangeDetectionStrategy, Component, ElementRef, signal, viewChild } from '@angular/core';

@Component({
  selector: 'app-rename-calculation-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './rename-calculation-dialog.component.html',
  styleUrl: './rename-calculation-dialog.component.scss',
})
export class RenameCalculationDialogComponent {
  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');

  protected readonly originalName = signal('');
  protected readonly currentValue = signal('');

  private resolvePromise?: (value: string | null) => void;
  private resolvedValue: string | null = null;

  open(currentName: string): Promise<string | null> {
    this.originalName.set(currentName);
    this.currentValue.set(currentName);
    this.resolvedValue = null;
    this.dialogRef().nativeElement.showModal();
    return new Promise((resolve) => (this.resolvePromise = resolve));
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
    this.resolvedValue = this.currentValue().trim();
    this.dialogRef().nativeElement.close();
  }

  protected cancel(): void {
    this.dialogRef().nativeElement.close();
  }

  protected onClose(): void {
    this.resolvePromise?.(this.resolvedValue);
    this.resolvePromise = undefined;
    this.resolvedValue = null;
  }
}
