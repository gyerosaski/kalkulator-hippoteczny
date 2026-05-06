import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  effect,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-number-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberInputComponent),
      multi: true,
    },
  ],
  templateUrl: './number-input.component.html',
})
export class NumberInputComponent implements ControlValueAccessor {
  /** Optional: use without formControlName by binding [value] directly. */
  readonly value = input<number | null>(null);
  suffix = input<string>('');
  hint = input<string>('');
  decimals = input<number>(2);
  valueChange = output<number>();

  focused = signal(false);
  disabled = signal(false);
  private readonly _value = signal(0);

  readonly display = computed(() => {
    const v = this._value();
    if (this.focused()) return String(v).replace('.', ',');
    if (isNaN(v)) return '—';
    return new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: this.decimals(),
      maximumFractionDigits: this.decimals(),
    }).format(v);
  });

  constructor() {
    effect(() => {
      const v = this.value();
      if (v !== null) this._value.set(v);
    });
  }

  private _onChange?: (value: number) => void;
  private _onTouched?: () => void;

  writeValue(value: number): void {
    this._value.set(value ?? 0);
  }

  registerOnChange(fn: (value: number) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onFocus(): void {
    this.focused.set(true);
  }

  onBlur(): void {
    this.focused.set(false);
    this._onTouched?.();
  }

  onInput(raw: string): void {
    const cleaned = raw.replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      this._value.set(num);
      this._onChange?.(num);
      this.valueChange.emit(num);
    } else if (cleaned === '') {
      this._value.set(0);
      this._onChange?.(0);
      this.valueChange.emit(0);
    }
  }
}
