import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconChevronDownComponent } from '../../icons/icon-chevron-down/icon-chevron-down.component';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [IconChevronDownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  templateUrl: './select.component.html',
})
export class SelectComponent implements ControlValueAccessor {
  options = input.required<string[]>();
  labels = input<string[]>([]);
  readonly value = input<string>('');
  valueChange = output<string>();

  disabled = signal(false);
  private readonly _cvaValue = signal<string | null>(null);
  readonly _value = computed(() => this._cvaValue() ?? this.value());

  private _onChange?: (v: string) => void;
  private _onTouched?: () => void;

  writeValue(v: string): void {
    this._cvaValue.set(v ?? '');
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
    this._cvaValue.set(val);
    this._onChange?.(val);
    this.valueChange.emit(val);
  }

  onBlur(): void {
    this._onTouched?.();
  }
}
