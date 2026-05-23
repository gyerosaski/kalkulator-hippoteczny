import { ChangeDetectionStrategy, Component, ElementRef, signal, viewChild } from '@angular/core';

import { SavedCalculation } from '../../model';
import { IconTrashComponent } from '../../components/icons/icon-trash/icon-trash.component';

@Component({
  selector: 'app-delete-calculation-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconTrashComponent],
  templateUrl: './delete-calculation-dialog.component.html',
  styleUrl: './delete-calculation-dialog.component.scss',
})
export class DeleteCalculationDialogComponent {
  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');

  protected readonly target = signal<SavedCalculation | null>(null);

  private resolvePromise?: (value: boolean) => void;
  private resolvedValue = false;

  open(calculation: SavedCalculation): Promise<boolean> {
    this.target.set(calculation);
    this.resolvedValue = false;
    this.dialogRef().nativeElement.showModal();
    return new Promise((resolve) => (this.resolvePromise = resolve));
  }

  protected confirm(): void {
    this.resolvedValue = true;
    this.dialogRef().nativeElement.close();
  }

  protected cancel(): void {
    this.dialogRef().nativeElement.close();
  }

  protected onClose(): void {
    this.resolvePromise?.(this.resolvedValue);
    this.resolvePromise = undefined;
    this.resolvedValue = false;
    this.target.set(null);
  }

  protected formatWholeAmount(value: number): string {
    return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(value);
  }

  protected formatPercent(value: number, decimals = 2): string {
    return new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  protected formatDate(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
  }
}
