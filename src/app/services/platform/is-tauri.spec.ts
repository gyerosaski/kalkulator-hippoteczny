import { isTauriRuntime } from './is-tauri';

describe('isTauriRuntime', () => {
  afterEach(() => {
    delete (window as unknown as Record<string, unknown>)['__TAURI_INTERNALS__'];
    delete (window as unknown as Record<string, unknown>)['__TAURI__'];
  });

  it('zwraca false w zwykłej przeglądarce (brak mostu IPC Tauri)', () => {
    expect(isTauriRuntime()).toBe(false);
  });

  it('zwraca true, gdy obecny jest __TAURI_INTERNALS__', () => {
    (window as unknown as Record<string, unknown>)['__TAURI_INTERNALS__'] = {};
    expect(isTauriRuntime()).toBe(true);
  });

  it('zwraca true, gdy obecny jest __TAURI__', () => {
    (window as unknown as Record<string, unknown>)['__TAURI__'] = {};
    expect(isTauriRuntime()).toBe(true);
  });
});
