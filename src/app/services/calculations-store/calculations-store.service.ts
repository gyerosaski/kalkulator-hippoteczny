import { Injectable } from '@angular/core';
import { load } from '@tauri-apps/plugin-store';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { appDataDir } from '@tauri-apps/api/path';

import { KeyValueStore, SavedCalculationRecord } from '../../model';
import { extractImportableRecords } from '../../helpers/saved-calculation-import.helper';
import { isTauriRuntime } from '../platform/is-tauri';
import { LocalStorageStore, storageKeyForStoreFile } from '../platform/local-storage-store';
import { downloadTextFile, pickAndReadTextFile } from '../platform/browser-file-io';

@Injectable({ providedIn: 'root' })
export class CalculationsStoreService {
  private static readonly STORE_FILE_NAME = 'calculations.json';
  private static readonly RECORDS_KEY = 'calculations';
  private static readonly FILE_FILTERS = [{ name: 'Kalkulacja JSON', extensions: ['json'] }];
  private static readonly CSV_FILE_FILTERS = [{ name: 'Plik CSV', extensions: ['csv'] }];
  /** Ścieżka assetu z seedem dla trybu przeglądarkowego (kopia realnego `calculations.json`). */
  private static readonly BROWSER_SEED_URL = 'dev-seed/calculations.json';
  /** Etykieta „ścieżki store'a" prezentowana w trybie przeglądarkowym (brak dostępu do FS). */
  private static readonly BROWSER_STORE_PATH_LABEL = 'localStorage (tryb przeglądarkowy)';

  private storePromise: Promise<KeyValueStore> | null = null;

  async listCalculations(): Promise<SavedCalculationRecord[]> {
    const store = await this.getStore();
    return (await store.get<SavedCalculationRecord[]>(CalculationsStoreService.RECORDS_KEY)) ?? [];
  }

  async saveCalculation(record: SavedCalculationRecord): Promise<void> {
    const store = await this.getStore();
    const records = await this.listCalculations();
    const existingIndex = records.findIndex((existing) => existing.name === record.name);
    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      records.push(record);
    }
    await store.set(CalculationsStoreService.RECORDS_KEY, records);
    await store.save();
  }

  async deleteCalculation(name: string): Promise<void> {
    const store = await this.getStore();
    const records = await this.listCalculations();
    const next = records.filter((record) => record.name !== name);
    await store.set(CalculationsStoreService.RECORDS_KEY, next);
    await store.save();
  }

  async exportToFile(record: SavedCalculationRecord): Promise<string | null> {
    const defaultPath = this.sanitizeFileName(record.name) + '.json';
    const content = JSON.stringify(record, null, 2);
    if (!isTauriRuntime()) return downloadTextFile(defaultPath, content);
    const targetPath = await saveDialog({
      defaultPath,
      filters: CalculationsStoreService.FILE_FILTERS,
      title: 'Zapisz kalkulację do pliku',
    });
    if (!targetPath) return null;
    await writeTextFile(targetPath, content);
    return targetPath;
  }

  async exportAllToFile(records: SavedCalculationRecord[]): Promise<string | null> {
    const dateString = new Date().toISOString().slice(0, 10);
    const defaultPath = `kalkulacje-${dateString}.json`;
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      count: records.length,
      calculations: records,
    };
    const content = JSON.stringify(exportPayload, null, 2);
    if (!isTauriRuntime()) return downloadTextFile(defaultPath, content);
    const targetPath = await saveDialog({
      defaultPath,
      filters: CalculationsStoreService.FILE_FILTERS,
      title: 'Eksportuj wszystkie kalkulacje do pliku',
    });
    if (!targetPath) return null;
    await writeTextFile(targetPath, content);
    return targetPath;
  }

  async exportCsvToFile(
    defaultFileName: string,
    csvContent: string,
    title: string,
  ): Promise<string | null> {
    const defaultPath = this.sanitizeFileName(defaultFileName);
    if (!isTauriRuntime()) return downloadTextFile(defaultPath, csvContent);
    const targetPath = await saveDialog({
      defaultPath,
      filters: CalculationsStoreService.CSV_FILE_FILTERS,
      title,
    });
    if (!targetPath) return null;
    await writeTextFile(targetPath, csvContent);
    return targetPath;
  }

  async exportJsonToFile(
    defaultFileName: string,
    jsonContent: string,
    title: string,
  ): Promise<string | null> {
    const defaultPath = this.sanitizeFileName(defaultFileName);
    if (!isTauriRuntime()) return downloadTextFile(defaultPath, jsonContent);
    const targetPath = await saveDialog({
      defaultPath,
      filters: CalculationsStoreService.FILE_FILTERS,
      title,
    });
    if (!targetPath) return null;
    await writeTextFile(targetPath, jsonContent);
    return targetPath;
  }

  async importFromFile(): Promise<SavedCalculationRecord[] | null> {
    if (!isTauriRuntime()) {
      const content = await pickAndReadTextFile('.json');
      if (content === null) return null;
      try {
        return extractImportableRecords(JSON.parse(content));
      } catch {
        return [];
      }
    }
    const selected = await openDialog({
      multiple: false,
      directory: false,
      filters: CalculationsStoreService.FILE_FILTERS,
      title: 'Wczytaj kalkulację z pliku',
    });
    if (!selected) return null;
    try {
      const content = await readTextFile(selected);
      return extractImportableRecords(JSON.parse(content));
    } catch {
      return [];
    }
  }

  async getStorePath(): Promise<string> {
    if (!isTauriRuntime()) return CalculationsStoreService.BROWSER_STORE_PATH_LABEL;
    return await appDataDir();
  }

  private async getStore(): Promise<KeyValueStore> {
    if (!this.storePromise) {
      this.storePromise = isTauriRuntime() ? this.loadTauriStore() : this.loadBrowserStore();
    }
    return this.storePromise;
  }

  /** ładuje natywny store Tauri (desktop). */
  private async loadTauriStore(): Promise<KeyValueStore> {
    return load(CalculationsStoreService.STORE_FILE_NAME, {
      defaults: { [CalculationsStoreService.RECORDS_KEY]: [] },
      autoSave: true,
    });
  }

  /** ładuje store przeglądarkowy (localStorage), jednorazowo zasilany seedem z realnych danych. */
  private async loadBrowserStore(): Promise<KeyValueStore> {
    await this.seedBrowserStoreIfEmpty();
    return new LocalStorageStore(CalculationsStoreService.STORE_FILE_NAME, {
      [CalculationsStoreService.RECORDS_KEY]: [],
    });
  }

  /**
   * zasiewa store przeglądarkowy snapshotem z `public/dev-seed/`, ale tylko przy pierwszym starcie.
   *
   * Warunkiem jest brak wpisu w `localStorage` — dzięki temu świadome wyczyszczenie listy przez
   * użytkownika (które zapisuje pustą tablicę) nie powoduje ponownego zasiania usuniętych kalkulacji.
   */
  private async seedBrowserStoreIfEmpty(): Promise<void> {
    const storageKey = storageKeyForStoreFile(CalculationsStoreService.STORE_FILE_NAME);
    if (localStorage.getItem(storageKey) !== null) return;
    try {
      const response = await fetch(CalculationsStoreService.BROWSER_SEED_URL);
      if (!response.ok) return;
      const parsed: unknown = await response.json();
      const records = this.extractSeedRecords(parsed);
      localStorage.setItem(
        storageKey,
        JSON.stringify({ [CalculationsStoreService.RECORDS_KEY]: records }),
      );
    } catch {
      // brak seeda / błąd sieci — start z pustą listą (LocalStorageStore zwróci `defaults`).
    }
  }

  /** wyłuskuje tablicę rekordów z seeda w formacie pliku store'a (`{ calculations }`) lub gołej tablicy. */
  private extractSeedRecords(parsed: unknown): SavedCalculationRecord[] {
    if (Array.isArray(parsed)) return parsed as SavedCalculationRecord[];
    if (parsed && typeof parsed === 'object') {
      const calculations = (parsed as Record<string, unknown>)[CalculationsStoreService.RECORDS_KEY];
      if (Array.isArray(calculations)) return calculations as SavedCalculationRecord[];
    }
    return [];
  }

  private sanitizeFileName(name: string): string {
    const sanitized = (name || '').replace(/[\\/:*?"<>|]/g, '_').trim();
    return sanitized || 'kalkulacja';
  }
}
