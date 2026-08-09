import { effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { AppSettingsStoreService } from '../app-settings-store/app-settings-store.service';

@Injectable({ providedIn: 'root' })
export class PixelHippoService {
  private platformId = inject(PLATFORM_ID);
  private readonly settingsStore = inject(AppSettingsStoreService);

  readonly isEnabled = signal<boolean>(this.loadPreference());

  constructor() {
    // localStorage pełni rolę szybkiego cache'u — hipopotam nie mignie przy starcie, gdy jest wyłączony.
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('pixelHippoEnabled', String(this.isEnabled()));
      }
    });

    // Kanoniczne źródło prawdy to settings.json — reconcile (oraz migracja przy pierwszym uruchomieniu).
    void this.reconcileWithStoredSettings();
  }

  setEnabled(pixelHippoEnabled: boolean): void {
    this.isEnabled.set(pixelHippoEnabled);
    void this.settingsStore.updateSettings({ pixelHippoEnabled });
  }

  private async reconcileWithStoredSettings(): Promise<void> {
    const stored = await this.settingsStore.getRawSettings();
    // Porównanie z `undefined`, a nie sprawdzenie prawdziwości — `false` jest poprawną zapisaną
    // wartością i truthiness-check zaseedowałby store z powrotem wartością `true`.
    if (stored?.pixelHippoEnabled !== undefined) {
      // Zapisane ustawienie jest nadrzędne — nadpisuje wartość z cache'u localStorage.
      this.isEnabled.set(stored.pixelHippoEnabled);
    } else {
      // Pierwsze uruchomienie lub plik zapisany przed wprowadzeniem opcji — zaseeduj settings.json
      // bieżącą wartością (migracja z localStorage / uzupełnienie brakującego pola).
      await this.settingsStore.updateSettings({ pixelHippoEnabled: this.isEnabled() });
    }
  }

  private loadPreference(): boolean {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('pixelHippoEnabled');
      if (stored === 'true') return true;
      if (stored === 'false') return false;
    }
    return true;
  }
}
