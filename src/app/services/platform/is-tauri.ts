/**
 * Wykrywa, czy aplikacja działa wewnątrz środowiska uruchomieniowego Tauri (desktop).
 *
 * Tauri wstrzykuje do `window` swoje wewnętrzne obiekty mostu IPC. Ich brak oznacza, że kod
 * wykonuje się w zwykłej przeglądarce (dev server `ng serve`), gdzie wtyczki `@tauri-apps/*`
 * nie mają mostu `invoke` i ich wywołania odrzucają. Ten strażnik pozwala wybrać fallback
 * przeglądarkowy zamiast natywnej ścieżki Tauri.
 *
 * @returns `true`, gdy dostępny jest most IPC Tauri; w przeciwnym razie `false`.
 */
export function isTauriRuntime(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)
  );
}
