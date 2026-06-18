import { ChangeDetectorRef, inject, Signal } from '@angular/core';

import { DialogComponent } from './dialog.component';

/**
 * Bazowa klasa dla okien dialogowych z imperatywnym API opartym na obietnicy.
 *
 * Hermetyzuje powtarzalny szkielet: otwarcie modala, przechowanie funkcji rozwiązującej obietnicę
 * oraz domyślnego wyniku, a następnie rozwiązanie obietnicy w momencie zamknięcia okna (również
 * przez Esc lub kliknięcie tła). Konkretny dialog dostarcza referencję do powłoki `ui-dialog`
 * (przez `viewChild`) i własną publiczną metodę `open(...)`, która ustawia stan i wywołuje
 * `beginInteraction(...)`.
 *
 * @typeParam TResult typ wartości zwracanej przez obietnicę otwarcia dialogu.
 */
export abstract class AbstractDialog<TResult> {
  /** Referencja do prezentacyjnej powłoki `ui-dialog` (dostarczana przez podklasę). */
  protected abstract readonly dialog: Signal<DialogComponent>;

  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  private resolvePending?: (result: TResult) => void;
  private pendingResult!: TResult;

  /** otwiera modal i zwraca obietnicę rozwiązywaną przy zamknięciu (domyślnie wartością `defaultResult`) */
  protected beginInteraction(defaultResult: TResult): Promise<TResult> {
    this.pendingResult = defaultResult;
    // Spłukanie detekcji zmian przed pokazaniem modala — przy OnPush ustawienie sygnałów w `open(...)`
    // jedynie planuje detekcję, więc bez tego natywny <dialog> wyświetliłby DOM z poprzedniego otwarcia
    // (stare zaznaczenie miga przez moment).
    this.changeDetectorRef.detectChanges();
    this.dialog().showModal();
    return new Promise((resolve) => (this.resolvePending = resolve));
  }

  /** zamyka modal, zatwierdzając podany wynik */
  protected closeWith(result: TResult): void {
    this.pendingResult = result;
    this.dialog().close();
  }

  /** zamyka modal, pozostawiając wynik domyślny (anulowanie) */
  protected dismiss(): void {
    this.dialog().close();
  }

  /** bindowane do outputu `(closed)` powłoki — rozwiązuje oczekującą obietnicę */
  protected handleClosed(): void {
    this.resolvePending?.(this.pendingResult);
    this.resolvePending = undefined;
  }
}
