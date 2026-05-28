import { Injectable, signal } from '@angular/core';

import { Toast, ToastVariant } from '../../model';

const TOAST_DURATION_MS = 3200;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly activeToast = signal<Toast | null>(null);
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly toast = this.activeToast.asReadonly();

  show(message: string, variant: ToastVariant = ToastVariant.SUCCESS): void {
    this.activeToast.set({ message, variant });
    if (this.toastTimeoutId !== null) clearTimeout(this.toastTimeoutId);
    this.toastTimeoutId = setTimeout(() => this.activeToast.set(null), TOAST_DURATION_MS);
  }
}
