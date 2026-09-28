import { Injectable } from '@angular/core';
import { load } from '@tauri-apps/plugin-store';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { appDataDir } from '@tauri-apps/api/path';

import { KeyValueStore, SavedCalculationRecord } from '../../model';
import { extractImportableRecords } from '../../helpers/saved-calculation-import.helper';
import { normalizeSavedCalculationRecords } from '../../helpers/saved-calculation-identity.helper';
import { isTauriRuntime } from '../platform/is-tauri';
import { LocalStorageStore, storageKeyForStoreFile } from '../platform/local-storage-store';
import { downloadTextFile, pickAndReadTextFile } from '../platform/browser-file-io';

@Injectable({ providedIn: 'root' })
export class CalculationsStoreService {
  private static readonly STORE_FILE_NAME = 'calculations.json';
  /** Kopia stanu sprzed ostatniego zapisu — ratunek, gdy główny plik store'a zostanie uszkodzony. */
  private static readonly BACKUP_STORE_FILE_NAME = 'calculations.backup.json';
  private static readonly RECORDS_KEY = 'calculations';
  private static readonly FILE_FILTERS = [{ name: 'Kalkulacja JSON', extensions: ['json'] }];
  private static readonly CSV_FILE_FILTERS = [{ name: 'Plik CSV', extensions: ['csv'] }];
  /** Ścieżka assetu z seedem dla trybu przeglądarkowego (kopia realnego `calculations.json`). */
  private static readonly BROWSER_SEED_URL = 'dev-seed/calculations.json';
  /** Etykieta „ścieżki store'a" prezentowana w trybie przeglądarkowym (brak dostępu do FS). */
  private static readonly BROWSER_STORE_PATH_LABEL = 'localStorage (tryb przeglądarkowy)';

  private storePromise: Promise<KeyValueStore> | null = null;
  private backupStorePromise: Promise<KeyValueStore> | null = null;
  /** Kolejka operacji na rekordach — każda operacja odczyt-modyfikacja-zapis wykonuje się w całości. */
  private operationQueue: Promise<unknown> = Promise.resolve();

  listCalculations(): Promise<SavedCalculationRecord[]> {
    return this.enqueue(() => this.readRecords());
  }

  /** Zapisuje rekord: zastępuje istniejący o tym samym `id` albo dopisuje nowy. */
  saveCalculation(record: SavedCalculationRecord): Promise<void> {
    return this.enqueue(async () => {
      const records = await this.readRecords();
      const existingIndex = records.findIndex((existing) => existing.id === record.id);
      const nextRecords =
        existingIndex >= 0
          ? records.map((existing, index) => (index === existingIndex ? record : existing))
          : [...records, record];
      await this.writeRecords(records, nextRecords);
    });
  }

  /**
   * Aktualizuje wybrane pola rekordu o podanym `id` jednym zapisem.
   * @returns `false`, gdy rekord nie istnieje.
   */
  updateCalculation(
    id: string,
    patch: Partial<Omit<SavedCalculationRecord, 'id'>>,
  ): Promise<boolean> {
    return this.enqueue(async () => {
      const records = await this.readRecords();
      if (!records.some((record) => record.id === id)) return false;
      const nextRecords = records.map((record) =>
        record.id === id ? { ...record, ...patch } : record,
      );
      await this.writeRecords(records, nextRecords);
      return true;
    });
  }

  deleteCalculation(id: string): Promise<void> {
    return this.enqueue(async () => {
      const records = await this.readRecords();
      await this.writeRecords(
        records,
        records.filter((record) => record.id !== id),
      );
    });
  }

  /** Rekordy z kopii zapasowej (stan sprzed ostatniego zapisu niepustej listy). */
  listBackupCalculations(): Promise<SavedCalculationRecord[]> {
    return this.enqueue(async () => {
      const backupStore = await this.getBackupStore();
      return (
        (await backupStore.get<SavedCalculationRecord[]>(CalculationsStoreService.RECORDS_KEY)) ??
        []
      );
    });
  }

  /**
   * Przywraca z kopii zapasowej rekordy, których nie ma na bieżącej liście (po `id`).
   * @returns liczba przywróconych rekordów.
   */
  restoreFromBackup(): Promise<number> {
    return this.enqueue(async () => {
      const backupStore = await this.getBackupStore();
      const backupRecords =
        (await backupStore.get<SavedCalculationRecord[]>(CalculationsStoreService.RECORDS_KEY)) ??
        [];
      const records = await this.readRecords();
      const presentIds = new Set(records.map((record) => record.id));
      const missingRecords = backupRecords.filter((record) => !presentIds.has(record.id));
      if (!missingRecords.length) return 0;
      const normalized = normalizeSavedCalculationRecords([...records, ...missingRecords]);
      await this.writeRecords(records, normalized.records);
      return missingRecords.length;
    });
  }

  /** Usuwa kopię zapasową (np. gdy użytkownik świadomie odrzuca jej przywrócenie). */
  discardBackup(): Promise<void> {
    return this.enqueue(async () => {
      const backupStore = await this.getBackupStore();
      await backupStore.set(CalculationsStoreService.RECORDS_KEY, []);
      await backupStore.save();
    });
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

  /** dopisuje operację do kolejki — kolejna startuje dopiero po zakończeniu poprzedniej */
  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.operationQueue.then(operation, operation);
    this.operationQueue = result.catch(() => undefined);
    return result;
  }

  /**
   * odczytuje rekordy i porządkuje ich tożsamość (brakujące `id`, zdublowane nazwy);
   * uporządkowany stan jest od razu zapisywany. Wywoływać wyłącznie wewnątrz `enqueue`.
   */
  private async readRecords(): Promise<SavedCalculationRecord[]> {
    const store = await this.getStore();
    const storedRecords =
      (await store.get<SavedCalculationRecord[]>(CalculationsStoreService.RECORDS_KEY)) ?? [];
    const normalized = normalizeSavedCalculationRecords(storedRecords);
    if (normalized.changed) {
      await store.set(CalculationsStoreService.RECORDS_KEY, normalized.records);
      await store.save();
    }
    return normalized.records;
  }

  /**
   * zapisuje nową listę rekordów; wcześniej, o ile poprzednia lista nie była pusta, kopiuje ją do
   * kopii zapasowej. Pusta lista nie nadpisuje kopii — dzięki temu start z uszkodzonego (pustego)
   * store'a i późniejszy zapis nie niszczą ostatniego dobrego stanu. Wywoływać wewnątrz `enqueue`.
   */
  private async writeRecords(
    previousRecords: SavedCalculationRecord[],
    nextRecords: SavedCalculationRecord[],
  ): Promise<void> {
    if (previousRecords.length) {
      const backupStore = await this.getBackupStore();
      await backupStore.set(CalculationsStoreService.RECORDS_KEY, previousRecords);
      await backupStore.save();
    }
    const store = await this.getStore();
    await store.set(CalculationsStoreService.RECORDS_KEY, nextRecords);
    await store.save();
  }

  private async getStore(): Promise<KeyValueStore> {
    if (!this.storePromise) {
      this.storePromise = isTauriRuntime()
        ? this.loadTauriStore(CalculationsStoreService.STORE_FILE_NAME)
        : this.loadBrowserStore();
    }
    return this.storePromise;
  }

  private async getBackupStore(): Promise<KeyValueStore> {
    if (!this.backupStorePromise) {
      this.backupStorePromise = isTauriRuntime()
        ? this.loadTauriStore(CalculationsStoreService.BACKUP_STORE_FILE_NAME)
        : Promise.resolve(
            new LocalStorageStore(CalculationsStoreService.BACKUP_STORE_FILE_NAME, {
              [CalculationsStoreService.RECORDS_KEY]: [],
            }),
          );
    }
    return this.backupStorePromise;
  }

  /** ładuje natywny store Tauri (desktop). */
  private async loadTauriStore(fileName: string): Promise<KeyValueStore> {
    return load(fileName, {
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
      const calculations = (parsed as Record<string, unknown>)[
        CalculationsStoreService.RECORDS_KEY
      ];
      if (Array.isArray(calculations)) return calculations as SavedCalculationRecord[];
    }
    return [];
  }

  private sanitizeFileName(name: string): string {
    const sanitized = (name || '').replace(/[\\/:*?"<>|]/g, '_').trim();
    return sanitized || 'kalkulacja';
  }
}
