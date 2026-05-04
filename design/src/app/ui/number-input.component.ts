import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';

@Component({
  selector: 'app-number-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inp" [class.inp--focus]="focused()" [class.inp--disabled]="disabled()">
      <input
        type="text"
        inputmode="decimal"
        [disabled]="disabled()"
        [value]="display()"
        (focus)="focused.set(true)"
        (blur)="focused.set(false)"
        (input)="onInput($any($event.target).value)"
        class="mono"
      />
      @if (suffix()) { <span class="suffix">{{ suffix() }}</span> }
      @if (hint()) { <span class="hint">{{ hint() }}</span> }
    </div>
  `,
})
export class NumberInputComponent {
  value = input.required<number>();
  valueChange = output<number>();
  suffix = input<string>('');
  hint = input<string>('');
  decimals = input<number>(0);
  disabled = input<boolean>(false);

  focused = signal(false);

  display = computed(() => {
    const v = this.value();
    if (this.focused()) return String(v).replace('.', ',');
    if (v === null || v === undefined || isNaN(v)) return '—';
    return new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: this.decimals(),
      maximumFractionDigits: this.decimals(),
    }).format(v);
  });

  onInput(raw: string) {
    const cleaned = raw.replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    if (!isNaN(num)) this.valueChange.emit(num);
    else if (cleaned === '') this.valueChange.emit(0);
  }
}
