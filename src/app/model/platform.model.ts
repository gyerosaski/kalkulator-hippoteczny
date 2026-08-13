/**
 * Minimalny interfejs magazynu klucz-wartość używany przez warstwę persystencji.
 *
 * Odwzorowuje podzbiór API `Store` z `@tauri-apps/plugin-store`, z którego korzysta kod aplikacji.
 * Dzięki temu store'y mogą operować na wspólnej abstrakcji, a runtime dostarcza implementację
 * właściwą dla środowiska: natywny `Store` Tauri (desktop) albo `LocalStorageStore` (przeglądarka).
 */
export interface KeyValueStore {
  /** Zwraca wartość spod klucza lub `undefined`, gdy klucz nie istnieje. */
  get<T>(key: string): Promise<T | undefined>;

  /** Zapisuje wartość pod kluczem. */
  set(key: string, value: unknown): Promise<void>;

  /** Utrwala bieżący stan magazynu (w Tauri: zapis pliku; w przeglądarce: zapis do `localStorage`). */
  save(): Promise<void>;

  /** Usuwa klucz; zwraca `true`, gdy klucz istniał. */
  delete(key: string): Promise<boolean>;
}
