import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { IconCalculatorComponent } from '../../icons/icon-calculator/icon-calculator.component';
import { IconSettingsComponent } from '../../icons/icon-settings/icon-settings.component';
import { SettingsDialogComponent } from '../../../dialogs/settings/settings-dialog.component';
import { AppRoute } from '../../../model';

@Component({
  selector: 'ui-topbar',
  standalone: true,
  imports: [IconCalculatorComponent, IconSettingsComponent, SettingsDialogComponent],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  private readonly router = inject(Router);
  protected readonly settingsDialog = viewChild.required(SettingsDialogComponent);

  private readonly routerUrl = toSignal(this.router.events.pipe(map(() => this.router.url)), {
    initialValue: this.router.url,
  });

  private readonly currentRoute = computed(() => (this.routerUrl() ?? '').split('/')[1] ?? '');

  protected readonly isCalculatorTab = computed(() => this.currentRoute() === AppRoute.CALCULATOR);

  protected readonly isCalculatorManagerTab = computed(
    () => this.currentRoute() === AppRoute.CALCULATOR_MANAGER,
  );

  protected readonly isCalculationsCompareTab = computed(
    () => this.currentRoute() === AppRoute.CALCULATIONS_COMPARE,
  );

  private readonly tabButtonElements = viewChildren<ElementRef<HTMLButtonElement>>('tabBtn');

  private readonly activeTabIndex = computed(() => {
    if (this.isCalculatorTab()) return 0;
    if (this.isCalculatorManagerTab()) return 1;
    if (this.isCalculationsCompareTab()) return 2;
    return 0;
  });

  protected readonly indicatorStyle = signal<{ left: string; width: string }>({
    left: '0px',
    width: '0px',
  });

  protected readonly isIndicatorVisible = signal(false);

  constructor() {
    afterRenderEffect(() => {
      const buttons = this.tabButtonElements();
      const activeIndex = this.activeTabIndex();
      const activeButton = buttons[activeIndex]?.nativeElement;
      if (!activeButton) return;
      const parentRect = activeButton.parentElement!.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      this.indicatorStyle.set({
        left: `${buttonRect.left - parentRect.left}px`,
        width: `${buttonRect.width}px`,
      });
      this.isIndicatorVisible.set(true);
    });
  }

  navigateToCalculator(): void {
    void this.router.navigate([AppRoute.CALCULATOR]);
  }

  navigateToCalculatorManager(): void {
    void this.router.navigate([AppRoute.CALCULATOR_MANAGER]);
  }

  navigateToCalculationsCompare(): void {
    void this.router.navigate([AppRoute.CALCULATIONS_COMPARE]);
  }
}
