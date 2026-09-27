import { Injectable } from '@angular/core';
import { load } from '@tauri-apps/plugin-store';

import { AppSettings, Density, KeyValueStore, Theme } from '../../model';
import { isTauriRuntime } from '../platform/is-tauri';
import { LocalStorageStore } from '../platform/local-storage-store';

const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: Theme.LIGHT,
  density: Density.STANDARD,
  pixelHippoEnabled: true,
};

@Injectable({ providedIn: 'root' })
export class AppSettingsStoreService {
  private static readonly STORE_FILE_NAME = 'settings.json';
  private static readonly SETTINGS_KEY = 'settings';

  private storePromise: Promise<KeyValueStore> | null = null;

  /** Pobiera ustawienia zmergowane z wartościami domyślnymi (uzupełnia brakujące pola). */
  async getSettings(): Promise<AppSettings> {
    const stored = await this.getRawSettings();
    return { ...DEFAULT_APP_SETTINGS, ...stored };
  }

  /** Pobiera surowe zapisane ustawienia lub `undefined`, gdy plik nie zawiera jeszcze wpisu. */
  async getRawSettings(): Promise<AppSettings | undefined> {
    const store = await this.getStore();
    return await store.get<AppSettings>(AppSettingsStoreService.SETTINGS_KEY);
  }

  /** Scala podane pola z bieżącymi ustawieniami i zapisuje całość (read-merge-write). */
  async updateSettings(partial: Partial<AppSettings>): Promise<void> {
    const store = await this.getStore();
    const current = await this.getSettings();
    const next: AppSettings = { ...current, ...partial };
    await store.set(AppSettingsStoreService.SETTINGS_KEY, next);
    await store.save();
  }

  private async getStore(): Promise<KeyValueStore> {
    if (!this.storePromise) {
      // Puste `defaults` (klucz `settings` celowo nieobecny) — dzięki temu `getRawSettings()`
      // zwraca `undefined` przy braku wpisu (rozróżnienie pierwszego uruchomienia od zapisanego
      // ustawienia w logice migracji); merge z `DEFAULT_APP_SETTINGS` robi `getSettings()`.
      // Poza Tauri (dev w przeglądarce) most IPC nie istnieje — używamy fallbacku na localStorage.
      this.storePromise = isTauriRuntime()
        ? load(AppSettingsStoreService.STORE_FILE_NAME, { defaults: {}, autoSave: true })
        : Promise.resolve(new LocalStorageStore(AppSettingsStoreService.STORE_FILE_NAME, {}));
    }
    return this.storePromise;
  }
}
