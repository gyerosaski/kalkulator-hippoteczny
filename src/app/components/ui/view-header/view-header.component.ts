import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Wspólna powłoka nagłówka widoku najwyższego poziomu (tytuł + linia meta + prawy region),
 * ustalona z jednakowym odstępem od headera aplikacji (topbara) dla wszystkich widoków.
 * Treść zmienną wstrzykuje się przez nazwane sloty: `[slot=meta]` (linia meta pod tytułem)
 * oraz `[slot=aside]` (prawy region — przyciski akcji lub pasek porównania).
 */
@Component({
  selector: 'ui-view-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './view-header.component.html',
  styleUrl: './view-header.component.scss',
})
export class ViewHeaderComponent {
  /** Tytuł widoku renderowany jako nagłówek strony. */
  readonly heading = input<string>('');
}
