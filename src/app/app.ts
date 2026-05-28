import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ThemeService } from './services/theme/theme.service';
import { TopbarComponent } from './components/ui/topbar/topbar.component';
import { ToastComponent } from './components/ui/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopbarComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly themeService = inject(ThemeService);
}
