import { Component, ChangeDetectionStrategy, computed, inject, input, output } from '@angular/core';
import { IconChevronRightComponent } from '../../icons/icon-chevron-right/icon-chevron-right.component';
import { ColorCodeMarkerComponent } from '../color-code-marker/color-code-marker.component';
import { FoldableSectionComponent } from '../foldable-section/foldable-section.component';
import { ColorCodeArea } from '../../../model';
import { UiStateService } from '../../../services/ui-state/ui-state.service';
import { formSubsectionAnchorId } from '../../../helpers/form-navigation.helper';

@Component({
  selector: 'ui-subsection',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconChevronRightComponent, ColorCodeMarkerComponent],
  templateUrl: './subsection.component.html',
  styleUrl: './subsection.component.scss',
  host: {
    '[attr.id]': 'anchorId()',
  },
})
export class SubsectionComponent {
  private readonly uiStateService = inject(UiStateService);
  /** Sekcja-rodzic dostarcza `sectionId` — podsekcja zawsze żyje wewnątrz `ui-foldable-section`. */
  private readonly parentSection = inject(FoldableSectionComponent, { optional: true });

  readonly num = input.required<number | string>();
  readonly title = input<string>('');
  readonly open = input<boolean>(false);
  readonly openChange = output<boolean>();
  readonly context = input<ColorCodeArea | null>(null);
  /** Klucz podsekcji z UiStateService; daje kotwicę przewijania i wyróżnienie po nawigacji z legendy. */
  readonly subsectionKey = input<string | null>(null);

  /** Anchor dla przewijania z legendy (UiStateService.revealFormSection). */
  protected readonly anchorId = computed(() => {
    const sectionId = this.parentSection?.sectionId() ?? null;
    const subsectionKey = this.subsectionKey();
    return sectionId !== null && subsectionKey !== null
      ? formSubsectionAnchorId(sectionId, subsectionKey)
      : null;
  });

  /** Tytuł pulsuje tylko dla celu wskazującego całą podsekcję; cel z `itemKey` wyróżnia konkretny element listy. */
  protected readonly isHighlighted = computed(() => {
    const target = this.uiStateService.highlightedNavigationTarget();
    const sectionId = this.parentSection?.sectionId() ?? null;
    return (
      target !== null &&
      sectionId !== null &&
      target.sectionId === sectionId &&
      target.subsectionKey !== undefined &&
      target.subsectionKey === this.subsectionKey() &&
      target.itemKey === undefined
    );
  });
}
