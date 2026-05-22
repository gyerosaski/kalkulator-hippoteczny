import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { ThemeService } from '../../../services/theme/theme.service';
import { LoadValidationErrorDialogComponent } from '../../../dialogs/load-validation-error/load-validation-error-dialog.component';
import { IconCalculatorComponent } from '../../icons/icon-calculator/icon-calculator.component';
import { IconSunComponent } from '../../icons/icon-sun/icon-sun.component';
import { IconMoonComponent } from '../../icons/icon-moon/icon-moon.component';

@Component({
  selector: 'ui-topbar',
  standalone: true,
  imports: [
    LoadValidationErrorDialogComponent,
    IconCalculatorComponent,
    IconSunComponent,
    IconMoonComponent,
  ],
  templateUrl: './topbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  protected readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  private readonly routerUrl = toSignal(this.router.events.pipe(map(() => this.router.url)), {
    initialValue: this.router.url,
  });

  protected readonly isSavedTab = computed(() => this.routerUrl()?.startsWith('/saved') ?? false);

  navigateToCalculator(): void {
    this.router.navigate(['']);
  }

  navigateToSaved(): void {
    this.router.navigate(['saved']);
  }
}
