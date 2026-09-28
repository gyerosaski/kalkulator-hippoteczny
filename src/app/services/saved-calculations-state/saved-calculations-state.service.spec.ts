import { TestBed } from '@angular/core/testing';

import { MortgageFormRawValue, SavedCalculationRecord } from '../../model';
import { CalculationsStoreService } from '../calculations-store/calculations-store.service';
import { storageKeyForStoreFile } from '../platform/local-storage-store';
import { SavedCalculationsStateService } from './saved-calculations-state.service';

const STORE_KEY = storageKeyForStoreFile('calculations.json');
const BACKUP_STORE_KEY = storageKeyForStoreFile('calculations.backup.json');

function buildRecord(name: string, id?: string): SavedCalculationRecord {
  return {
    ...(id === undefined ? {} : { id }),
    name,
    createdAt: '2026-01-01T00:00:00.000Z',
    data: {} as MortgageFormRawValue,
  } as SavedCalculationRecord;
}

function seedStore(records: SavedCalculationRecord[]): void {
  localStorage.setItem(STORE_KEY, JSON.stringify({ calculations: records }));
}

function storedRecords(key = STORE_KEY): SavedCalculationRecord[] {
  const raw = localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as { calculations: SavedCalculationRecord[] }).calculations : [];
}

/**
 * Integracja stanu zapisanych kalkulacji ze store'em w trybie przeglądarkowym (localStorage):
 * unikalne nazwy przy zmianie nazwy i duplikowaniu, kompletność przy równoległych zapisach
 * oraz przywracanie z kopii zapasowej.
 */
describe('SavedCalculationsStateService (zapis kalkulacji)', () => {
  let service: SavedCalculationsStateService;
  let store: CalculationsStoreService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(SavedCalculationsStateService);
    store = TestBed.inject(CalculationsStoreService);
  });

  afterEach(() => localStorage.clear());

  it('nadaje identyfikatory rekordom zapisanym bez `id` i utrwala je', async () => {
    seedStore([buildRecord('A'), buildRecord('B')]);

    await service.loadAll();

    const ids = service.records().map((record) => record.id);
    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(2);
    expect(storedRecords().map((record) => record.id)).toEqual(ids);
  });

  it('zmiana nazwy na nazwę innej kalkulacji jest odrzucana i niczego nie nadpisuje', async () => {
    seedStore([buildRecord('A', 'id-a'), buildRecord('B', 'id-b')]);
    await service.loadAll();

    const renamed = await service.rename('id-a', 'B');

    expect(renamed).toBe(false);
    expect(storedRecords().map((record) => [record.id, record.name])).toEqual([
      ['id-a', 'A'],
      ['id-b', 'B'],
    ]);
  });

  it('zmiana nazwy aktualizuje rekord w miejscu, zachowując jego identyfikator', async () => {
    seedStore([buildRecord('A', 'id-a'), buildRecord('B', 'id-b')]);
    await service.loadAll();

    const renamed = await service.rename('id-a', 'Nowa nazwa');

    expect(renamed).toBe(true);
    expect(storedRecords().map((record) => [record.id, record.name])).toEqual([
      ['id-a', 'Nowa nazwa'],
      ['id-b', 'B'],
    ]);
  });

  it('kolejne duplikaty dostają unikalne nazwy i identyfikatory', async () => {
    seedStore([buildRecord('A', 'id-a')]);
    await service.loadAll();

    const firstCopyName = await service.duplicate('id-a');
    const secondCopyName = await service.duplicate('id-a');

    expect(firstCopyName).toBe('A — kopia');
    expect(secondCopyName).toBe('A — kopia (2)');
    const records = storedRecords();
    expect(records.map((record) => record.name)).toEqual(['A', 'A — kopia', 'A — kopia (2)']);
    expect(new Set(records.map((record) => record.id)).size).toBe(3);
  });

  it('usuwa dokładnie jeden rekord, także gdy starsze zapisy miały zdublowane nazwy', async () => {
    seedStore([buildRecord('A', 'id-1'), buildRecord('A', 'id-2')]);
    await service.loadAll();

    expect(service.records().map((record) => record.name)).toEqual(['A', 'A — kopia']);
    await service.remove('id-2');

    expect(storedRecords().map((record) => record.id)).toEqual(['id-1']);
  });

  it('równoległe zapisy nie gubią rekordów (kolejka operacji)', async () => {
    seedStore([]);

    await Promise.all([
      store.saveCalculation(buildRecord('A', 'id-a')),
      store.saveCalculation(buildRecord('B', 'id-b')),
      store.saveCalculation(buildRecord('C', 'id-c')),
    ]);

    expect(storedRecords().map((record) => record.id)).toEqual(['id-a', 'id-b', 'id-c']);
  });

  it('pusta lista z niepustą kopią zapasową pozwala przywrócić kalkulacje', async () => {
    seedStore([buildRecord('A', 'id-a'), buildRecord('B', 'id-b')]);
    await service.loadAll();
    // zapis wykonuje kopię poprzedniego stanu; potem symulujemy uszkodzony (pusty) store
    await service.rename('id-a', 'A2');
    seedStore([]);

    await service.loadAll();
    expect(service.backupRecordCount()).toBe(2);

    const restoredCount = await service.restoreBackup();

    expect(restoredCount).toBe(2);
    expect(storedRecords().map((record) => record.name)).toEqual(['A', 'B']);
    expect(service.backupRecordCount()).toBe(0);
  });

  it('zapis pustej listy nie nadpisuje kopii zapasowej ostatniego dobrego stanu', async () => {
    seedStore([buildRecord('A', 'id-a')]);
    await service.loadAll();
    await service.remove('id-a');
    // pusta lista → kolejny zapis nie może zastąpić kopii pustym stanem
    await store.saveCalculation(buildRecord('B', 'id-b'));

    expect(storedRecords(BACKUP_STORE_KEY).map((record) => record.id)).toEqual(['id-a']);
  });

  it('odrzucenie kopii zapasowej ukrywa baner przywracania', async () => {
    seedStore([buildRecord('A', 'id-a')]);
    await service.loadAll();
    await service.remove('id-a');
    await service.loadAll();
    expect(service.backupRecordCount()).toBe(1);

    await service.discardBackup();
    await service.loadAll();

    expect(service.backupRecordCount()).toBe(0);
  });
});
