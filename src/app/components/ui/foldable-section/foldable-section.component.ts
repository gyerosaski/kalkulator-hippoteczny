import { Component, ChangeDetectionStrategy, input, signal, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IconChevronRightComponent } from '../../icons/icon-chevron-right/icon-chevron-right.component';

@Component({
  selector: 'app-foldable-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './foldable-section.component.html',
  imports: [ReactiveFormsModule, IconChevronRightComponent],
})
export class FoldableSectionComponent {
  title = input.required<string>();
  num = input<string>('');
  badge = input<string>('');
  defaultOpen = input<boolean>(true);
  toggleable = input<boolean>(false);
  included = input<FormControl<boolean>>();
  enabledChange = output<boolean>();

  open = signal(true);

  get includedControl(): FormControl<boolean> {
    return this.included() as unknown as FormControl<boolean>;
  }

  constructor() {
    queueMicrotask(() => this.open.set(this.defaultOpen()));
  }

  isOff = () => this.toggleable() && !this.included()?.value;

  toggleOpen() {
    if (this.isOff()) return;
    this.open.update((v) => !v);
  }
}
