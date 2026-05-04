import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-segmented',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="seg" [class.seg--compact]="compact()">
      @for (o of options(); track o) {
        <button class="seg-btn" [class.is-on]="o === value()" (click)="valueChange.emit(o)">{{ o }}</button>
      }
    </div>
  `,
})
export class SegmentedComponent {
  options = input.required<string[]>();
  value = input.required<string>();
  valueChange = output<string>();
  compact = input<boolean>(false);
}
