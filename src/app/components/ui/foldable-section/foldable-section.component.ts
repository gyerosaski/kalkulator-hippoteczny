import {
  Component,
  ChangeDetectionStrategy,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { IconChevronRightComponent } from '../../icons/icon-chevron-right/icon-chevron-right.component';
import { FormSectionId } from '../../../model';
import { UiStateService } from '../../../services/ui-state/ui-state.service';
import { formSectionAnchorId } from '../../../helpers/form-navigation.helper';

@Component({
  selector: 'ui-foldable-section',
  standalone: true,
  imports: [IconChevronRightComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './foldable-section.component.html',
  host: {
    '[attr.id]': 'anchorId()',
  },
})
export class FoldableSectionComponent {
  private readonly uiStateService = inject(UiStateService);

  title = input.required<string>();
  num = input<string>('');
  badge = input<string>('');
  defaultOpen = input<boolean>(true);
  toggleable = input<boolean>(false);
  enabled = input<boolean>(true);
  /** Gdy ustawione, stan rozwinięcia jest trzymany w UiStateService i przeżywa zmianę widoku. */
  sectionId = input<FormSectionId | null>(null);
  enabledChange = output<boolean>();

  private readonly localOpen = linkedSignal(() => this.defaultOpen());

  /** Anchor dla przewijania z legendy (UiStateService.revealFormSection). */
  protected readonly anchorId = computed(() => {
    const sectionId = this.sectionId();
    return sectionId !== null ? formSectionAnchorId(sectionId) : null;
  });

  readonly open = computed(() => {
    const sectionId = this.sectionId();
    return sectionId !== null
      ? this.uiStateService.sectionOpen(sectionId, this.defaultOpen())()
      : this.localOpen();
  });

  protected readonly isAnimatable = signal(false);

  constructor() {
    afterNextRender(() => this.isAnimatable.set(true));
  }

  isOff = () => this.toggleable() && !this.enabled();

  toggleOpen() {
    if (this.isOff()) return;
    const sectionId = this.sectionId();
    if (sectionId !== null) {
      this.uiStateService.toggleSection(sectionId, this.defaultOpen());
    } else {
      this.localOpen.update((value) => !value);
    }
  }
}
