import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  viewChild,
  ElementRef,
  forwardRef,
  DestroyRef,
  inject,
  afterNextRender,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconChevronDownComponent } from '../../icons/icon-chevron-down/icon-chevron-down.component';

let nextUiSelectId = 0;

@Component({
  selector: 'ui-select',
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
  styleUrl: './select.component.scss',
})
export class SelectComponent implements ControlValueAccessor {
  options = input.required<string[]>();
  labels = input<string[]>([]);
  inputId = input<string>('');
  valueChange = output<string>();

  readonly triggerEl = viewChild.required<ElementRef<HTMLButtonElement>>('triggerEl');

  readonly disabled = signal(false);
  readonly isOpen = signal(false);
  readonly focused = signal(false);
  readonly activeIndex = signal(-1);
  readonly _panelStyle = signal<Record<string, string>>({});

  private readonly _cvaValue = signal<string | null>(null);
  readonly value = computed(() => this._cvaValue() ?? this.options()[0] ?? '');

  readonly _displayLabel = computed(() => {
    const currentValue = this.value();
    const currentOptions = this.options();
    const currentLabels = this.labels();
    const index = currentOptions.indexOf(currentValue);
    if (index === -1) return currentValue;
    return currentLabels[index] || currentValue;
  });

  readonly panelId = `ui-select-panel-${nextUiSelectId++}`;

  private _onChange?: (v: string) => void;
  private _onTouched?: () => void;
  private readonly _destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const handler = (event: PointerEvent) => {
        if (!this.isOpen()) return;
        const target = event.target as Node;
        const hostElement = this.triggerEl().nativeElement.closest('.sel');
        if (!hostElement?.contains(target)) {
          this.closePanel();
        }
      };
      document.addEventListener('pointerdown', handler);
      this._destroyRef.onDestroy(() => {
        document.removeEventListener('pointerdown', handler);
      });
    });
  }

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

  toggle(): void {
    if (this.isOpen()) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  openPanel(): void {
    const rect = this.triggerEl().nativeElement.getBoundingClientRect();
    this._panelStyle.set({
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
    });
    const currentIndex = this.options().indexOf(this.value());
    this.activeIndex.set(currentIndex >= 0 ? currentIndex : 0);
    this.isOpen.set(true);
  }

  closePanel(): void {
    this.isOpen.set(false);
  }

  select(option: string): void {
    this._cvaValue.set(option);
    this._onChange?.(option);
    this.valueChange.emit(option);
    this.closePanel();
    this.triggerEl().nativeElement.focus();
  }

  onKeydown(event: KeyboardEvent): void {
    const currentOptions = this.options();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.openPanel();
        } else {
          this.activeIndex.set(Math.min(this.activeIndex() + 1, currentOptions.length - 1));
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (!this.isOpen()) {
          this.openPanel();
        } else {
          this.activeIndex.set(Math.max(this.activeIndex() - 1, 0));
        }
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.isOpen()) {
          this.openPanel();
        } else {
          const activeOption = currentOptions[this.activeIndex()];
          if (activeOption !== undefined) {
            this.select(activeOption);
          }
        }
        break;

      case 'Escape':
        if (this.isOpen()) {
          event.preventDefault();
          this.closePanel();
        }
        break;

      case 'Tab':
        if (this.isOpen()) {
          this.closePanel();
        }
        break;
    }
  }

  onBlur(): void {
    this._onTouched?.();
    if (!this.isOpen()) {
      this.focused.set(false);
    }
  }
}
