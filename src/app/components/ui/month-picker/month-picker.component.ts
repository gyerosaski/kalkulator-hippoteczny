import { Component, ChangeDetectionStrategy, signal, output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconCalendarComponent } from '../../icons/icon-calendar/icon-calendar.component';

@Component({
  selector: 'app-month-picker',
  standalone: true,
  imports: [IconCalendarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MonthPickerComponent),
      multi: true,
    },
  ],
  templateUrl: './month-picker.component.html',
})
export class MonthPickerComponent implements ControlValueAccessor {
  valueChange = output<string>();

  focused = signal(false);
  disabled = signal(false);
  readonly _value = signal('');

  private _onChange?: (v: string) => void;
  private _onTouched?: () => void;

  writeValue(v: string): void {
    this._value.set(v ?? '');
  }
  registerOnChange(fn: (v: string) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
  setDisabledState(d: boolean): void {
    this.disabled.set(d);
  }

  onNativeChange(val: string): void {
    this._value.set(val);
    this._onChange?.(val);
    this.valueChange.emit(val);
  }

  onBlur(): void {
    this.focused.set(false);
    this._onTouched?.();
  }
}
