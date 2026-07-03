import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { BtnRemoveComponent } from '../btn-remove/btn-remove.component';

@Component({
  selector: 'ui-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BtnRemoveComponent],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {
  readonly tag = input<string>('');
  readonly removable = input<boolean>(false);
  readonly bare = input<boolean>(false);
  /** Jednorazowy puls obrysu karty — wskazuje element po nawigacji z legendy do formularza. */
  readonly highlighted = input<boolean>(false);
  readonly remove = output<void>();
}
