import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'ui-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './section.component.html',
  styleUrl: './section.component.scss',
})
export class SectionComponent {
  readonly title = input<string>('');
}
