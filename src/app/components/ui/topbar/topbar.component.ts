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
import { PixelHippoComponent } from '../pixel-hippo/pixel-hippo.component';
import { AppRoute } from '../../../model';

@Component({
  selector: 'ui-topbar',
  standalone: true,
  imports: [
    IconCalculatorComponent,
    IconSettingsComponent,
    SettingsDialogComponent,
    PixelHippoComponent,
  ],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:resize)': 'updateIndicatorPosition()' },
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
      this.tabButtonElements();
      this.activeTabIndex();
      this.updateIndicatorPosition();
    });
  }

  protected updateIndicatorPosition(): void {
    const buttons = this.tabButtonElements();
    const activeButton = buttons[this.activeTabIndex()]?.nativeElement;
    if (!activeButton) return;
    this.indicatorStyle.set({
      left: `${activeButton.offsetLeft}px`,
      width: `${activeButton.offsetWidth}px`,
    });
    this.isIndicatorVisible.set(true);
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
