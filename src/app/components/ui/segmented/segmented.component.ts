import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  forwardRef,
  inject,
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
  protected readonly indicatorStyle = signal<{ left: string; width: string } | null>(null);

  protected readonly isIndicatorVisible = signal(false);

  private _onChange?: (v: string) => void;
  private _onTouched?: () => void;

  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterRenderEffect(() => this.updateIndicator());

    // Gdy kontrolka pojawia się dopiero po pierwszym renderze (np. wewnątrz okna dialogowego),
    // nie ma jeszcze layoutu i wskaźnik nie może zostać umiejscowiony. ResizeObserver przelicza
    // go, gdy element uzyska wymiary (oraz przy każdej zmianie rozmiaru).
    afterNextRender(() => {
      const observer = new ResizeObserver(() => this.updateIndicator());
      observer.observe(this.hostElement.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  private updateIndicator(): void {
    const buttons = this.segBtnElements();
    const activeButton = buttons[this.activeIndex()]?.nativeElement;
    if (!activeButton) return;
    const parentRect = activeButton.parentElement!.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    if (buttonRect.width === 0) return;
    this.indicatorStyle.set({
      left: `${buttonRect.left - parentRect.left}px`,
      width: `${buttonRect.width}px`,
    });
    this.isIndicatorVisible.set(true);
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
