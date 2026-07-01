import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { Density } from '../../model';
import { AppSettingsStoreService } from '../app-settings-store/app-settings-store.service';

@Injectable({ providedIn: 'root' })
export class DensityService {
  private platformId = inject(PLATFORM_ID);
  private readonly settingsStore = inject(AppSettingsStoreService);

  readonly density = signal<Density>(this.loadPreference());

  readonly dataDensity = computed<string | null>(() => {
    const density = this.density();
    return density === Density.COMFORTABLE ? null : density.toLowerCase();
  });

  constructor() {
    // localStorage pełni rolę szybkiego cache'u do natychmiastowego pomalowania gęstości przy starcie.
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('density', this.density());
      }
    });

    // Kanoniczne źródło prawdy to settings.json — reconcile (oraz migracja przy pierwszym uruchomieniu).
    void this.reconcileWithStoredSettings();
  }

  setDensity(density: Density): void {
    this.density.set(density);
    void this.settingsStore.updateSettings({ density });
  }

  private async reconcileWithStoredSettings(): Promise<void> {
    const stored = await this.settingsStore.getRawSettings();
    if (stored?.density) {
      // Zapisane ustawienie jest nadrzędne — nadpisuje wartość z cache'u localStorage.
      this.density.set(stored.density);
    } else {
      // Pierwsze uruchomienie lub plik zapisany przed wprowadzeniem gęstości — zaseeduj settings.json
      // bieżącą wartością (migracja z localStorage / uzupełnienie brakującego pola).
      await this.settingsStore.updateSettings({ density: this.density() });
    }
  }

  private loadPreference(): Density {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('density');
      if (stored && (Object.values(Density) as string[]).includes(stored)) return stored as Density;
    }
    return Density.COMFORTABLE;
  }
}
