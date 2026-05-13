import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CalcService } from '../calc.service';
import { Palette, Density, FontPair, ViewState } from '../models';

@Component({
  selector: 'app-tweaks-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button class="tw-fab" (click)="open.set(!open())" aria-label="Tweaks">⚙︎</button>
    @if (open()) {
      <div class="tw-panel">
        <div class="tw-head">
          <span>Tweaks</span>
          <button class="tw-close" (click)="open.set(false)">✕</button>
        </div>
        <div class="tw-body">
          <div class="tw-section">
            <div class="tw-label">Paleta</div>
            <div class="tw-radio">
              @for (p of palettes; track p.value) {
                <button
                  [class.is-on]="calc.tweaks().palette === p.value"
                  (click)="calc.saveTweaks({ palette: p.value })"
                >
                  {{ p.label }}
                </button>
              }
            </div>
          </div>
          <div class="tw-section">
            <div class="tw-label">Gęstość</div>
            <div class="tw-radio">
              @for (d of densities; track d.value) {
                <button
                  [class.is-on]="calc.tweaks().density === d.value"
                  (click)="calc.saveTweaks({ density: d.value })"
                >
                  {{ d.label }}
                </button>
              }
            </div>
          </div>
          <div class="tw-section">
            <div class="tw-label">Typografia</div>
            <div class="tw-radio">
              @for (f of fonts; track f.value) {
                <button
                  [class.is-on]="calc.tweaks().fontPair === f.value"
                  (click)="calc.saveTweaks({ fontPair: f.value })"
                >
                  {{ f.label }}
                </button>
              }
            </div>
          </div>
          <div class="tw-section">
            <div class="tw-label">Stan widoku</div>
            <div class="tw-radio tw-radio--3">
              @for (v of views; track v.value) {
                <button
                  [class.is-on]="calc.tweaks().viewState === v.value"
                  (click)="calc.saveTweaks({ viewState: v.value })"
                >
                  {{ v.label }}
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .tw-fab {
        position: fixed;
        right: 20px;
        bottom: 20px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 1px solid var(--line);
        background: var(--surface);
        box-shadow: var(--shadow-lg);
        cursor: pointer;
        font-size: 18px;
        z-index: 1000;
      }
      .tw-panel {
        position: fixed;
        right: 20px;
        bottom: 76px;
        width: 280px;
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 16px;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        padding: 12px;
      }
      .tw-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 8px 12px;
        font-weight: 600;
        font-size: 13px;
      }
      .tw-close {
        border: 0;
        background: transparent;
        cursor: pointer;
        color: var(--muted);
      }
      .tw-section {
        padding: 8px;
      }
      .tw-label {
        font-size: 11px;
        color: var(--muted);
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .tw-radio {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
        background: var(--surface-2);
        border-radius: 10px;
        padding: 3px;
      }
      .tw-radio--3 {
        grid-template-columns: 1fr 1fr 1fr;
      }
      .tw-radio button {
        border: 0;
        padding: 8px 10px;
        border-radius: 8px;
        font: inherit;
        background: transparent;
        color: var(--ink-2);
        cursor: pointer;
        font-size: 12px;
      }
      .tw-radio button.is-on {
        background: var(--surface);
        color: var(--ink);
        box-shadow: 0 1px 2px oklch(40% 0.02 250 / 0.08);
      }
    `,
  ],
})
export class TweaksPanelComponent {
  calc = inject(CalcService);
  open = signal(false);

  palettes: { value: Palette; label: string }[] = [
    { value: 'sage', label: 'Szałwia' },
    { value: 'peach', label: 'Brzoskwinia' },
    { value: 'lavender', label: 'Lawenda' },
    { value: 'mist', label: 'Mgła' },
  ];
  densities: { value: Density; label: string }[] = [
    { value: 'cozy', label: 'Kompakt' },
    { value: 'comfy', label: 'Komfort' },
    { value: 'roomy', label: 'Luźno' },
  ];
  fonts: { value: FontPair; label: string }[] = [
    { value: 'inter', label: 'Inter Tight' },
    { value: 'fraunces', label: 'Söhne+Plex' },
    { value: 'system', label: 'System' },
  ];
  views: { value: ViewState; label: string }[] = [
    { value: 'auto', label: 'Auto' },
    { value: 'results', label: 'Wyniki' },
    { value: 'errors', label: 'Błędy' },
  ];
}
