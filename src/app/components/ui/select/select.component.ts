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

@Component({
  selector: 'ui-select',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
})
export class SelectComponent implements ControlValueAccessor {
  options = input.required<string[]>();
  labels = input<string[]>([]);
  inputId = input<string>('');
  valueChange = output<string>();

  readonly disabled = signal(false);
  private readonly _cvaValue = signal<string | null>(null);
  readonly value = computed(() => this._cvaValue() ?? this.options()[0] ?? '');

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

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onValueChange(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this._cvaValue.set(selectedValue);
    this._onChange?.(selectedValue);
    this.valueChange.emit(selectedValue);
  }

  onBlur(): void {
    this._onTouched?.();
  }
}
