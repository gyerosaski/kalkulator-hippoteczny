import { Injectable } from '@angular/core';
import { load, type Store } from '@tauri-apps/plugin-store';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';

import { SavedCalculationRecord } from '../../model';

@Injectable({ providedIn: 'root' })
export class CalculationsStoreService {
  private static readonly STORE_FILE_NAME = 'calculations.json';
  private static readonly RECORDS_KEY = 'calculations';
  private static readonly FILE_FILTERS = [{ name: 'Kalkulacja JSON', extensions: ['json'] }];

  private storePromise: Promise<Store> | null = null;

  async listCalculations(): Promise<SavedCalculationRecord[]> {
    const store = await this.getStore();
    return (await store.get<SavedCalculationRecord[]>(CalculationsStoreService.RECORDS_KEY)) ?? [];
  }

  async hasCalculation(name: string): Promise<boolean> {
    const records = await this.listCalculations();
    return records.some((record) => record.name === name);
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
    const targetPath = await saveDialog({
      defaultPath,
      filters: CalculationsStoreService.FILE_FILTERS,
      title: 'Zapisz kalkulację do pliku',
    });
    if (!targetPath) return null;
    await writeTextFile(targetPath, JSON.stringify(record, null, 2));
    return targetPath;
  }

  async exportAllToFile(records: SavedCalculationRecord[]): Promise<string | null> {
    const dateString = new Date().toISOString().slice(0, 10);
    const defaultPath = `kalkulacje-${dateString}.json`;
    const targetPath = await saveDialog({
      defaultPath,
      filters: CalculationsStoreService.FILE_FILTERS,
      title: 'Eksportuj wszystkie kalkulacje do pliku',
    });
    if (!targetPath) return null;
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      count: records.length,
      calculations: records,
    };
    await writeTextFile(targetPath, JSON.stringify(exportPayload, null, 2));
    return targetPath;
  }

  async importFromFile(): Promise<{
    record: SavedCalculationRecord | null;
    rawData: unknown;
  } | null> {
    const selected = await openDialog({
      multiple: false,
      directory: false,
      filters: CalculationsStoreService.FILE_FILTERS,
      title: 'Wczytaj kalkulację z pliku',
    });
    if (!selected) return null;
    const content = await readTextFile(selected);
    const parsed = JSON.parse(content);
    if (this.isSavedCalculationRecord(parsed)) {
      return { record: parsed, rawData: parsed.data };
    }
    return { record: null, rawData: parsed };
  }

  async getStorePath(): Promise<string> {
    const dataDirectory = await appDataDir();
    return await appDataDir();
    return await join(dataDirectory, CalculationsStoreService.STORE_FILE_NAME);
  }

  private async getStore(): Promise<Store> {
    if (!this.storePromise) {
      this.storePromise = load(CalculationsStoreService.STORE_FILE_NAME, {
        defaults: { [CalculationsStoreService.RECORDS_KEY]: [] },
        autoSave: true,
      });
    }
    return this.storePromise;
  }

  private sanitizeFileName(name: string): string {
    const sanitized = (name || '').replace(/[\\/:*?"<>|]/g, '_').trim();
    return sanitized || 'kalkulacja';
  }

  private isSavedCalculationRecord(value: unknown): value is SavedCalculationRecord {
    return (
      typeof value === 'object' &&
      value !== null &&
      'name' in value &&
      'createdAt' in value &&
      'data' in value &&
      typeof (value as { name: unknown }).name === 'string'
    );
  }
}
