import { LocalStorageStore, storageKeyForStoreFile } from './local-storage-store';

describe('storageKeyForStoreFile', () => {
  it('dokłada prefiks tauri-store: do nazwy pliku', () => {
    expect(storageKeyForStoreFile('calculations.json')).toBe('tauri-store:calculations.json');
  });
});

describe('LocalStorageStore', () => {
  beforeEach(() => localStorage.clear());

  it('zwraca wartość domyślną, gdy klucz nie został jeszcze zapisany', async () => {
    const store = new LocalStorageStore('calculations.json', { calculations: [] });
    expect(await store.get('calculations')).toEqual([]);
  });

  it('zwraca undefined dla nieznanego klucza bez wartości domyślnej', async () => {
    const store = new LocalStorageStore('settings.json', {});
    expect(await store.get('settings')).toBeUndefined();
  });

  it('utrwala wartość zapisaną przez set i odczytuje ją ponownie', async () => {
    const store = new LocalStorageStore('calculations.json', { calculations: [] });
    await store.set('calculations', [{ name: 'A' }]);
    expect(await store.get('calculations')).toEqual([{ name: 'A' }]);
  });

  it('zapis natychmiast trafia do localStorage pod właściwym kluczem', async () => {
    const store = new LocalStorageStore('calculations.json', {});
    await store.set('calculations', [1, 2, 3]);
    const raw = localStorage.getItem('tauri-store:calculations.json');
    expect(raw).toBe(JSON.stringify({ calculations: [1, 2, 3] }));
  });

  it('nowa instancja czyta stan zapisany przez poprzednią (trwałość między „sesjami”)', async () => {
    await new LocalStorageStore('calculations.json', {}).set('calculations', [{ name: 'B' }]);
    const reopened = new LocalStorageStore('calculations.json', { calculations: [] });
    expect(await reopened.get('calculations')).toEqual([{ name: 'B' }]);
  });

  it('delete usuwa klucz i zwraca informację, czy istniał', async () => {
    const store = new LocalStorageStore('calculations.json', {});
    await store.set('calculations', []);
    expect(await store.delete('calculations')).toBe(true);
    expect(await store.delete('calculations')).toBe(false);
    expect(await store.get('calculations')).toBeUndefined();
  });

  it('izoluje osobne pliki store w osobnych wpisach localStorage', async () => {
    const calculations = new LocalStorageStore('calculations.json', {});
    const settings = new LocalStorageStore('settings.json', {});
    await calculations.set('calculations', [{ name: 'A' }]);
    await settings.set('settings', { theme: 'DARK' });
    expect(await calculations.get('calculations')).toEqual([{ name: 'A' }]);
    expect(await settings.get('settings')).toEqual({ theme: 'DARK' });
  });

  it('traktuje uszkodzony JSON w localStorage jak pusty stan', async () => {
    localStorage.setItem('tauri-store:calculations.json', '{ niepoprawny json');
    const store = new LocalStorageStore('calculations.json', { calculations: [] });
    expect(await store.get('calculations')).toEqual([]);
  });
});
