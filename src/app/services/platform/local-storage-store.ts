import { KeyValueStore } from '../../model';

/** Prefiks kluczy `localStorage` dla magazynów odwzorowujących pliki store'a Tauri. */
const STORAGE_KEY_PREFIX = 'tauri-store:';

/**
 * Zwraca klucz `localStorage`, pod którym trzymany jest dany „plik" store'a.
 *
 * @param fileName nazwa pliku store'a (np. `calculations.json`), użyta jako przestrzeń nazw.
 */
export function storageKeyForStoreFile(fileName: string): string {
  return STORAGE_KEY_PREFIX + fileName;
}

/**
 * Przeglądarkowa implementacja {@link KeyValueStore} oparta o `localStorage`.
 *
 * Zastępuje natywny `Store` z `@tauri-apps/plugin-store` w trybie dev bez Tauri. Każda instancja
 * odwzorowuje jeden „plik" store'a na pojedynczy wpis `localStorage` (klucz z prefiksem
 * `tauri-store:`), przechowujący obiekt `{ [key]: value }` — dzięki temu `calculations.json`
 * i `settings.json` są od siebie odizolowane, tak jak osobne pliki w Tauri.
 */
export class LocalStorageStore implements KeyValueStore {
  private readonly storageKey: string;
  private readonly defaults: Record<string, unknown>;

  /**
   * @param fileName nazwa pliku store'a, będąca przestrzenią nazw wpisu `localStorage`.
   * @param defaults wartości domyślne zwracane przez {@link get}, gdy klucz nie został jeszcze zapisany.
   */
  constructor(fileName: string, defaults: Record<string, unknown> = {}) {
    this.storageKey = storageKeyForStoreFile(fileName);
    this.defaults = defaults;
  }

  async get<T>(key: string): Promise<T | undefined> {
    const state = this.readState();
    if (key in state) return state[key] as T;
    return this.defaults[key] as T | undefined;
  }

  async set(key: string, value: unknown): Promise<void> {
    const state = this.readState();
    state[key] = value;
    this.writeState(state);
  }

  async save(): Promise<void> {
    // stan jest utrwalany natychmiast przy każdym `set`/`delete` — `save()` istnieje dla zgodności API.
  }

  async delete(key: string): Promise<boolean> {
    const state = this.readState();
    const existed = key in state;
    if (existed) {
      delete state[key];
      this.writeState(state);
    }
    return existed;
  }

  /** Odczytuje i parsuje stan magazynu z `localStorage`; zwraca pusty obiekt przy braku lub błędzie. */
  private readState(): Record<string, unknown> {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }

  /** Serializuje i zapisuje stan magazynu do `localStorage`. */
  private writeState(state: Record<string, unknown>): void {
    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }
}
