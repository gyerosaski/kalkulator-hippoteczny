import { Component, ChangeDetectionStrategy, input, output, signal, computed, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="sel">
      <select
        [disabled]="disabled()"
        [value]="_value()"
        (change)="onNativeChange($any($event.target).value)"
        (blur)="onBlur()"
      >
        @for (o of options(); track o; let i = $index) {
          <option [value]="o">{{ labels()[i] || o }}</option>
        }
      </select>
      <svg width="12" height="12" viewBox="0 0 12 12">
        <path d="M2 4 L6 8 L10 4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      </svg>
    </div>
  `,
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

  writeValue(v: string): void { this._cvaValue.set(v ?? ''); }
  registerOnChange(fn: (v: string) => void): void { this._onChange = fn; }
  registerOnTouched(fn: () => void): void { this._onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled.set(d); }

  onNativeChange(val: string): void {
    this._cvaValue.set(val);
    this._onChange?.(val);
    this.valueChange.emit(val);
  }

  onBlur(): void {
    this._onTouched?.();
  }
}
