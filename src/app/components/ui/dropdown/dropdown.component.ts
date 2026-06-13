import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  output,
  signal,
} from '@angular/core';

import { DropdownPlacement } from '../../../model';
import { IconChevronDownComponent } from '../../icons/icon-chevron-down/icon-chevron-down.component';

@Component({
  selector: 'ui-dropdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss',
  imports: [IconChevronDownComponent],
})
export class DropdownComponent {
  readonly options = input.required<string[]>();
  readonly labels = input<string[]>([]);
  readonly disabled = input<boolean>(false);
  readonly placement = input<DropdownPlacement>(DropdownPlacement.DOWN);

  readonly select = output<string>();

  protected readonly DropdownPlacement = DropdownPlacement;
  readonly open = signal(false);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open.set(false);
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest?.('.dropdown-wrap')) {
      this.open.set(false);
    }
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled()) return;
    this.open.update((isOpen) => !isOpen);
  }

  labelFor(index: number, option: string): string {
    return this.labels()[index] ?? option;
  }

  choose(option: string): void {
    this.select.emit(option);
    this.open.set(false);
  }
}
