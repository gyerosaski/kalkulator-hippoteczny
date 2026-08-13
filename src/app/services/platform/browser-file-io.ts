/**
 * Przeglądarkowe odpowiedniki natywnych operacji plikowych i okien dialogowych Tauri.
 *
 * Używane w trybie dev bez Tauri, gdzie wtyczki `@tauri-apps/plugin-dialog` i `plugin-fs`
 * nie działają. Sygnatury zwracają te same kontrakty co odpowiadające im metody store'a,
 * dzięki czemu gałąź przeglądarkowa jest podmienialna 1:1.
 */

/**
 * Inicjuje pobranie pliku tekstowego przez przeglądarkę (Blob + tymczasowy odnośnik `download`).
 *
 * @param fileName proponowana nazwa pliku.
 * @param content treść tekstowa do zapisania.
 * @returns nazwę pliku (odpowiednik „ścieżki docelowej" zwracanej przez wariant Tauri).
 */
export function downloadTextFile(fileName: string, content: string): string {
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return fileName;
}

/**
 * Otwiera systemowy wybór pliku i zwraca jego treść tekstową.
 *
 * @param accept lista akceptowanych rozszerzeń dla atrybutu `accept`.
 * @returns treść wybranego pliku albo `null`, gdy użytkownik anulował wybór.
 */
export function pickAndReadTextFile(accept = '.json,.csv'): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';

    let settled = false;
    const cleanup = (): void => {
      input.removeEventListener('change', onChange);
      input.removeEventListener('cancel', onCancel);
      input.remove();
    };
    const settle = (value: string | null): void => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };

    // odczyt zawartości po wyborze pliku
    const onChange = async (): Promise<void> => {
      const file = input.files?.[0];
      if (!file) {
        settle(null);
        return;
      }
      try {
        settle(await file.text());
      } catch {
        settle(null);
      }
    };

    // anulowanie okna wyboru
    const onCancel = (): void => settle(null);

    input.addEventListener('change', onChange);
    input.addEventListener('cancel', onCancel);
    document.body.appendChild(input);
    input.click();
  });
}
