import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { ThemeService } from '../../../services/theme/theme.service';
import { IconCalculatorComponent } from '../../icons/icon-calculator/icon-calculator.component';
import { IconSunComponent } from '../../icons/icon-sun/icon-sun.component';
import { IconMoonComponent } from '../../icons/icon-moon/icon-moon.component';
import { AppRoute } from '../../../model';

@Component({
  selector: 'ui-topbar',
  standalone: true,
  imports: [IconCalculatorComponent, IconSunComponent, IconMoonComponent],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  protected readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

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
