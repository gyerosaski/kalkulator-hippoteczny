import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';

import { DialogVariant, SavedCalculation } from '../../model';
import { AbstractDialog } from '../../components/ui/dialog/abstract-dialog';
import { DialogComponent } from '../../components/ui/dialog/dialog.component';

@Component({
  selector: 'app-delete-calculation-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogComponent],
  templateUrl: './delete-calculation-dialog.component.html',
  styleUrl: './delete-calculation-dialog.component.scss',
})
export class DeleteCalculationDialogComponent extends AbstractDialog<boolean> {
  protected readonly dialog = viewChild.required(DialogComponent);
  protected readonly DialogVariant = DialogVariant;

  protected readonly target = signal<SavedCalculation | null>(null);

  open(calculation: SavedCalculation): Promise<boolean> {
    this.target.set(calculation);
    return this.beginInteraction(false);
  }

  protected override handleClosed(): void {
    super.handleClosed();
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
