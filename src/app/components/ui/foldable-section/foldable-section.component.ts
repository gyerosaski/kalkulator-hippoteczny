import { Component, ChangeDetectionStrategy, input, signal, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IconChevronRightComponent } from '../../icons/icon-chevron-right/icon-chevron-right.component';

@Component({
  selector: 'app-foldable-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="sec" [class.is-open]="open() && !isOff()" [class.sec--off]="isOff()">
      <div class="sec-head-wrap">
        <button class="sec-head" (click)="toggleOpen()" [disabled]="isOff()">
          <span class="sec-chev">
            <icon-chevron-right />
          </span>
          @if (num()) {
            <span class="sec-num">{{ num() }}</span>
          }
          <span class="sec-title">{{ title() }}</span>
          @if (badge()) {
            <span class="sec-badge">{{ badge() }}</span>
          }
        </button>
        @if (toggleable()) {
          <label
            class="sec-switch"
            [title]="included()?.value ? 'Wyłącz sekcję' : 'Włącz sekcję'"
            (click)="$event.stopPropagation()"
          >
            <input type="checkbox" [formControl]="includedControl" />
            <span class="switch-track"><span class="switch-thumb"></span></span>
            <span class="switch-lab">{{ included()?.value ? 'wł.' : 'wył.' }}</span>
          </label>
        }
      </div>
      @if (open() && !isOff()) {
        <div class="sec-body">
          <ng-content />
        </div>
      }
    </section>
  `,
  imports: [ReactiveFormsModule, IconChevronRightComponent],
})
export class FoldableSectionComponent {
  title = input.required<string>();
  num = input<string>('');
  badge = input<string>('');
  defaultOpen = input<boolean>(true);
  toggleable = input<boolean>(false);
  included = input<FormControl<boolean>>();
  enabledChange = output<boolean>();

  open = signal(true);

  get includedControl(): FormControl<boolean> {
    return this.included() as unknown as FormControl<boolean>;
  }

  constructor() {
    queueMicrotask(() => this.open.set(this.defaultOpen()));
  }

  isOff = () => this.toggleable() && !this.included()?.value;

  toggleOpen() {
    if (this.isOff()) return;
    this.open.update((v) => !v);
  }
}
