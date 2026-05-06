import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { IconChevronRightComponent } from '../../icons/icon-chevron-right/icon-chevron-right.component';

@Component({
  selector: 'app-section',
  standalone: true,
  imports: [IconChevronRightComponent],
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
            [title]="enabled() ? 'Wyłącz sekcję' : 'Włącz sekcję'"
            (click)="$event.stopPropagation()"
          >
            <input
              type="checkbox"
              [checked]="enabled()"
              (change)="enabledChange.emit($any($event.target).checked)"
            />
            <span class="switch-track"><span class="switch-thumb"></span></span>
            <span class="switch-lab">{{ enabled() ? 'wł.' : 'wył.' }}</span>
          </label>
        }
      </div>
      @if (open() && !isOff()) {
        <div class="sec-body"><ng-content /></div>
      }
    </section>
  `,
})
export class SectionComponent {
  title = input.required<string>();
  num = input<string>('');
  badge = input<string>('');
  defaultOpen = input<boolean>(true);
  toggleable = input<boolean>(false);
  enabled = input<boolean>(true);
  enabledChange = output<boolean>();

  open = signal(true);

  constructor() {
    queueMicrotask(() => this.open.set(this.defaultOpen()));
  }

  isOff = () => this.toggleable() && !this.enabled();

  toggleOpen() {
    if (this.isOff()) return;
    this.open.update((v) => !v);
  }
}
