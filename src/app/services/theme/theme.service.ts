import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { Theme } from '../../model';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);

  readonly theme = signal<Theme>(this.loadPreference());

  readonly dataTheme = computed<string | null>(() => {
    const theme = this.theme();
    return theme === Theme.LIGHT ? null : theme.toLowerCase();
  });

  constructor() {
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('theme', this.theme());
      }
    });
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  private loadPreference(): Theme {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) {
        if ((Object.values(Theme) as string[]).includes(stored)) return stored as Theme;
        // Kompatybilność wsteczna ze starymi wartościami 'dark'/'light'.
        if (stored === 'dark') return Theme.DARK;
        if (stored === 'light') return Theme.LIGHT;
      }
    }
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : Theme.LIGHT;
    }
    return Theme.LIGHT;
  }
}
