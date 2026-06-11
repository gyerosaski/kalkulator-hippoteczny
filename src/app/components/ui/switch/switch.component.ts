import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ui-switch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SwitchComponent),
      multi: true,
    },
  ],
  templateUrl: './switch.component.html',
  styleUrl: './switch.component.scss',
})
export class SwitchComponent implements ControlValueAccessor {
  readonly label = input<string>('');

  protected readonly checked = signal(false);
  protected readonly disabled = signal(false);

  private onChange?: (value: boolean) => void;
  private onTouched?: () => void;

  writeValue(value: boolean): void {
    this.checked.set(value ?? false);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  protected toggle(checked: boolean): void {
    if (this.disabled()) return;
    this.checked.set(checked);
    this.onChange?.(checked);
    this.onTouched?.();
  }
}
