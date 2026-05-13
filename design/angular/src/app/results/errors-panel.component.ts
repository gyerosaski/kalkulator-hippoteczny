import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { FormError } from '../models';

interface Group {
  section: string;
  items: FormError[];
}

function pluralErr(n: number): string {
  if (n === 1) return '1 błąd';
  const lastTwo = n % 100;
  const last = n % 10;
  if (lastTwo >= 12 && lastTwo <= 14) return `${n} błędów`;
  if (last >= 2 && last <= 4) return `${n} błędy`;
  return `${n} błędów`;
}

@Component({
  selector: 'app-errors-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="errors-view">
      <!-- HERO -->
      <div class="err-hero">
        <div class="err-hero-ico">
          <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
            <circle cx="22" cy="22" r="20" fill="var(--err-tint)" />
            <circle
              cx="22"
              cy="22"
              r="20"
              fill="none"
              stroke="var(--err-deep)"
              stroke-opacity="0.25"
              stroke-width="1"
            />
            <path
              d="M22 11 L33.5 30.5 H10.5 Z"
              fill="none"
              stroke="var(--err-deep)"
              stroke-width="1.8"
              stroke-linejoin="round"
            />
            <path
              d="M22 17.5 V24"
              stroke="var(--err-deep)"
              stroke-width="1.8"
              stroke-linecap="round"
            />
            <circle cx="22" cy="27.4" r="1.3" fill="var(--err-deep)" />
          </svg>
        </div>
        <div class="err-hero-text">
          <div class="err-hero-tag">FORMULARZ WYMAGA POPRAWEK</div>
          <h2 class="err-hero-title">
            Popraw <span class="err-hero-count">{{ totalLabel() }}</span
            >, aby zobaczyć harmonogram
          </h2>
          <p class="err-hero-sub">
            Wykresy, podsumowanie i tabela spłat pojawią się tutaj, gdy formularz po lewej będzie
            kompletny i spójny.
          </p>
        </div>
      </div>

      <!-- GROUPS -->
      <div class="err-groups">
        @for (g of groups(); track g.section) {
          <div class="err-card">
            <div class="err-card-head">
              <h3 class="err-card-title">{{ g.section }}</h3>
              <span class="err-card-count">{{ pluralFor(g.items.length) }}</span>
            </div>
            <ul class="err-list">
              @for (err of g.items; track $index) {
                <li class="err-row">
                  <span class="err-row-bullet" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 16 16">
                      <path
                        d="M8 1.5 L14.5 13 H1.5 Z"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.4"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M8 5.6 V9.2"
                        stroke="currentColor"
                        stroke-width="1.4"
                        stroke-linecap="round"
                      />
                      <circle cx="8" cy="11.3" r="0.9" fill="currentColor" />
                    </svg>
                  </span>
                  <div class="err-row-body">
                    <div class="err-row-msg">{{ err.message }}</div>
                    @if (err.detail) {
                      <div class="err-row-detail mono">{{ err.detail }}</div>
                    }
                    <div class="err-row-meta">
                      <span class="err-row-field">
                        @if (err.fieldNum) {
                          <span class="err-row-num">{{ err.fieldNum }}</span>
                        }
                        <span>{{ err.fieldLabel }}</span>
                      </span>
                      <button class="err-row-goto" (click)="goto.emit(err)">
                        Pokaż pole
                        <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
                          <path
                            d="M2 5.5 H9 M6 2.5 L9 5.5 L6 8.5"
                            stroke="currentColor"
                            stroke-width="1.4"
                            fill="none"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              }
            </ul>
          </div>
        }
      </div>

      <!-- GHOST PREVIEW -->
      <div class="err-ghost" aria-hidden="true">
        <div class="err-ghost-tag">
          <span class="err-ghost-dot"></span>
          podgląd wyników niedostępny
        </div>
        <div class="err-ghost-kpis">
          @for (_ of [0, 1, 2, 3]; track $index) {
            <div class="err-ghost-kpi">
              <div class="err-ghost-line err-ghost-line--xs"></div>
              <div class="err-ghost-line err-ghost-line--lg"></div>
              <div class="err-ghost-line err-ghost-line--xs"></div>
            </div>
          }
        </div>
        <div class="err-ghost-charts">
          <div class="err-ghost-card">
            <svg viewBox="0 0 120 120" class="err-ghost-donut">
              <circle
                cx="60"
                cy="60"
                r="46"
                fill="none"
                stroke="var(--err-ghost-line)"
                stroke-width="14"
                stroke-dasharray="4 6"
              />
            </svg>
            <div class="err-ghost-legend">
              <div class="err-ghost-line err-ghost-line--sm"></div>
              <div class="err-ghost-line err-ghost-line--sm"></div>
              <div class="err-ghost-line err-ghost-line--sm"></div>
              <div class="err-ghost-line err-ghost-line--sm"></div>
            </div>
          </div>
          <div class="err-ghost-card err-ghost-card--chart">
            <svg viewBox="0 0 240 80" preserveAspectRatio="none" class="err-ghost-trend">
              <path
                d="M0 70 C 40 60, 70 50, 110 38 S 200 18, 240 10"
                fill="none"
                stroke="var(--err-ghost-line)"
                stroke-width="1.5"
                stroke-dasharray="3 4"
              />
              <path d="M0 78 L240 78" stroke="var(--err-ghost-line)" stroke-opacity="0.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ErrorsPanelComponent {
  errors = input.required<FormError[]>();
  goto = output<FormError>();

  groups = computed<Group[]>(() => {
    const order = ['Dane podstawowe', 'Transze', 'Nadpłaty', 'Koszty okołokredytowe i promocje'];
    const map: Record<string, FormError[]> = {};
    for (const e of this.errors()) {
      (map[e.section] = map[e.section] || []).push(e);
    }
    return order.filter((s) => map[s]).map((s) => ({ section: s, items: map[s] }));
  });

  totalLabel = computed(() => pluralErr(this.errors().length));
  pluralFor(n: number): string {
    return pluralErr(n);
  }
}
