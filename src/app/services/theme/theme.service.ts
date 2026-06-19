import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { Theme } from '../../model';
import { AppSettingsStoreService } from '../app-settings-store/app-settings-store.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private readonly settingsStore = inject(AppSettingsStoreService);

  readonly theme = signal<Theme>(this.loadPreference());

  readonly dataTheme = computed<string | null>(() => {
    const theme = this.theme();
    return theme === Theme.LIGHT ? null : theme.toLowerCase();
  });

  constructor() {
    // localStorage pełni rolę szybkiego cache'u do natychmiastowego pomalowania motywu przy starcie.
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('theme', this.theme());
      }
    });

    // Kanoniczne źródło prawdy to settings.json — reconcile (oraz migracja przy pierwszym uruchomieniu).
    void this.reconcileWithStoredSettings();
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    void this.settingsStore.updateSettings({ theme });
  }

  private async reconcileWithStoredSettings(): Promise<void> {
    const stored = await this.settingsStore.getRawSettings();
    if (stored) {
      // Zapisane ustawienie jest nadrzędne — nadpisuje wartość z cache'u localStorage.
      this.theme.set(stored.theme);
    } else {
      // Pierwsze uruchomienie: zaseeduj settings.json bieżącą wartością (migracja z localStorage).
      await this.settingsStore.updateSettings({ theme: this.theme() });
    }
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
