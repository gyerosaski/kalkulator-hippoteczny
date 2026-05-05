import { Component, ChangeDetectionStrategy, signal, output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormatMonthPipe } from '../../../pipes/format-month/format-month.pipe';

@Component({
  selector: 'app-month-picker',
  standalone: true,
  imports: [FormatMonthPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MonthPickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="inp inp--date" [class.inp--focus]="focused()" [class.inp--disabled]="disabled()">
      <input
        type="month"
        [disabled]="disabled()"
        [value]="_value()"
        class="mono"
        (focus)="focused.set(true)"
        (blur)="onBlur()"
        (change)="onNativeChange($any($event.target).value)"
      />
      <svg width="14" height="14" viewBox="0 0 14 14" class="cal-ico">
        <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" fill="none"/>
        <path d="M1.5 5.5 H12.5" stroke="currentColor"/>
        <path d="M4 1 V3.5 M10 1 V3.5" stroke="currentColor" stroke-linecap="round"/>
      </svg>
    </div>
    @if (_value()) {
      <div class="field-hint">{{ _value() | formatMonth }}</div>
    }
  `,
})
export class MonthPickerComponent implements ControlValueAccessor {
  valueChange = output<string>();

  focused = signal(false);
  disabled = signal(false);
  readonly _value = signal('');

  private _onChange?: (v: string) => void;
  private _onTouched?: () => void;

  writeValue(v: string): void { this._value.set(v ?? ''); }
  registerOnChange(fn: (v: string) => void): void { this._onChange = fn; }
  registerOnTouched(fn: () => void): void { this._onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled.set(d); }

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
