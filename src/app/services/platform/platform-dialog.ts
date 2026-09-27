import { ask, type ConfirmDialogOptions } from '@tauri-apps/plugin-dialog';

import { isTauriRuntime } from './is-tauri';

/**
 * Wyświetla okno potwierdzenia (tak/nie), wybierając implementację właściwą dla środowiska.
 *
 * W Tauri deleguje do natywnego okna `ask`. Poza Tauri (dev w przeglądarce) używa `window.confirm`,
 * doklejając ewentualny tytuł nad treścią pytania (natywny `confirm` nie ma osobnego pola tytułu).
 *
 * @param message treść pytania.
 * @param options opcje zgodne z natywnym oknem Tauri (m.in. `title`, `kind`).
 * @returns `true`, gdy użytkownik potwierdził; w przeciwnym razie `false`.
 */
export async function confirmDialog(
  message: string,
  options?: ConfirmDialogOptions,
): Promise<boolean> {
  if (isTauriRuntime()) return ask(message, options);
  if (typeof window === 'undefined') return false;
  return window.confirm(options?.title ? `${options.title}\n\n${message}` : message);
}
