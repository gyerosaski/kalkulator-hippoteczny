import { Component, ChangeDetectionStrategy, effect, input, output, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { IconChevronRightComponent } from '../../icons/icon-chevron-right/icon-chevron-right.component';
import { ColorCodeArea } from '../../../model';
import { ColorCodeMarkerComponent } from '../color-code-marker/color-code-marker.component';

@Component({
  selector: 'ui-section',
  standalone: true,
  imports: [IconChevronRightComponent, ColorCodeMarkerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './section.component.html',
})
export class SectionComponent {
  title = input.required<string>();
  num = input<string>('');
  badge = input<string>('');
  marker = input<ColorCodeArea | null>(null);
  defaultOpen = input<boolean>(true);
  toggleable = input<boolean>(false);
  enabled = input<boolean>(true);
  enabledChange = output<boolean>();
  expandedControl = input<FormControl<boolean> | null>(null);

  open = signal(true);

  constructor() {
    effect((onCleanup) => {
      const control = this.expandedControl();
      if (control) {
        this.open.set(control.value);
        const subscription = control.valueChanges.subscribe((value) => this.open.set(value));
        onCleanup(() => subscription.unsubscribe());
      } else {
        this.open.set(this.defaultOpen());
      }
    });
  }

  isOff = () => this.toggleable() && !this.enabled();

  toggleOpen() {
    if (this.isOff()) return;
    const newValue = !this.open();
    this.open.set(newValue);
    this.expandedControl()?.setValue(newValue);
  }
}
