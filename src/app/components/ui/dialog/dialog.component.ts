import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

import { DialogSize, DialogVariant } from '../../../model';
import { IconXComponent } from '../../icons/icon-x/icon-x.component';

/**
 * Generyczna powłoka okna dialogowego oparta na natywnym elemencie `<dialog>`.
 *
 * Dostarcza wspólny „chrome" (ramka, cień, tło, backdrop, warianty szerokości) oraz opcjonalny
 * standardowy nagłówek (tag + tytuł + przycisk zamknięcia) budowany z inputów. Treść okna oraz —
 * w razie potrzeby — własny nagłówek (slot `head`) są wstrzykiwane przez content projection.
 *
 * Logika imperatywnego API (Promise zwracany z `open()`) żyje w `AbstractDialog`; ten komponent
 * eksponuje jedynie `showModal()`/`close()` oraz output `closed`.
 */
@Component({
  selector: 'ui-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconXComponent],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
})
export class DialogComponent {
  readonly tag = input<string>('');
  readonly title = input<string>('');
  readonly variant = input<DialogVariant>(DialogVariant.DEFAULT);
  readonly size = input<DialogSize>(DialogSize.MEDIUM);
  readonly showClose = input<boolean>(true);

  readonly closed = output<void>();

  protected readonly DialogVariant = DialogVariant;

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');

  showModal(): void {
    this.dialogRef().nativeElement.showModal();
  }

  close(): void {
    this.dialogRef().nativeElement.close();
  }

  protected onNativeClose(): void {
    this.closed.emit();
  }
}
