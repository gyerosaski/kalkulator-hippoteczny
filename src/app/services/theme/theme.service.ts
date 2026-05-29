import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { Theme } from '../../model';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);

  readonly theme = signal<Theme>(this.loadPreference());

  readonly darkMode = computed(() => this.theme() === Theme.DARK);

  constructor() {
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('theme', this.theme() === Theme.DARK ? 'dark' : 'light');
      }
    });
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  private loadPreference(): Theme {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark' ? Theme.DARK : Theme.LIGHT;
    }
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : Theme.LIGHT;
    }
    return Theme.LIGHT;
  }
}
