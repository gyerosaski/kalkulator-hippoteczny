import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  output,
  forwardRef,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconCalendarComponent } from '../../icons/icon-calendar/icon-calendar.component';
import { MonthPickerDialogComponent } from '../../../dialogs/month-picker/month-picker-dialog.component';

@Component({
  selector: 'ui-month-picker',
  standalone: true,
  imports: [IconCalendarComponent, MonthPickerDialogComponent],
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
  inputId = input<string>('');
  showShortcuts = input<boolean>(false);

  focused = signal(false);
  disabled = signal(false);
  readonly _value = signal('');

  private readonly monthPickerDialog = viewChild.required(MonthPickerDialogComponent);

  async openPicker(): Promise<void> {
    if (this.disabled()) return;
    const result = await this.monthPickerDialog().open(this._value(), this.showShortcuts());
    if (result !== null) {
      this.onNativeChange(result);
    }
  }

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
