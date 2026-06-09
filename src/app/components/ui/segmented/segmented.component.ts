import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ui-segmented',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SegmentedComponent),
      multi: true,
    },
  ],
  templateUrl: './segmented.component.html',
})
export class SegmentedComponent implements ControlValueAccessor {
  options = input.required<string[]>();
  labels = input<string[]>([]);
  compact = input<boolean>(false);

  disabled = signal(false);
  readonly _value = signal<string | null>(null);

  private readonly segBtnElements = viewChildren<ElementRef<HTMLButtonElement>>('segBtn');
  private readonly activeIndex = computed(() => this.options().indexOf(this._value() ?? ''));
  protected readonly indicatorStyle = signal<{ left: string; width: string }>({
    left: '0px',
    width: '0px',
  });

  protected readonly isIndicatorVisible = signal(false);

  private _onChange?: (v: string) => void;
  private _onTouched?: () => void;

  constructor() {
    afterRenderEffect(() => {
      const buttons = this.segBtnElements();
      const activeButton = buttons[this.activeIndex()]?.nativeElement;
      if (!activeButton) return;
      const parentRect = activeButton.parentElement!.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      this.indicatorStyle.set({
        left: `${buttonRect.left - parentRect.left}px`,
        width: `${buttonRect.width}px`,
      });
      this.isIndicatorVisible.set(true);
    });
  }

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

  select(option: string): void {
    if (this.disabled()) return;
    this._value.set(option);
    this._onChange?.(option);
    this._onTouched?.();
  }
}
