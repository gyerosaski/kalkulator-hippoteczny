import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalcService, fmtPLN, monthLabel } from '../calc.service';
import { DonutComponent, DonutSlice } from '../results/donut.component';
import { TrendChartComponent } from '../results/trend-chart.component';
import { Offer, Comparison } from '../models';

/* ========== helpers ========== */
const fmt0 = (v: number) => fmtPLN(v, 0);
const fmt2 = (v: number) => fmtPLN(v, 2);
const fmtPct = (v: number, dec = 2) =>
  new Intl.NumberFormat('pl-PL', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(
    v,
  );
const sign = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '');
const periodTxt = (y: number, m: number) => (m ? `${y} l. ${m} m-cy` : `${y} lat`);

type DeltaKind = 'good' | 'bad' | 'eq';
function deltaKind(d: number, invert = false): DeltaKind {
  if (Math.abs(d) < 0.5) return 'eq';
  const positive = invert ? d > 0 : d < 0;
  return positive ? 'good' : 'bad';
}

interface ParamRow {
  group: string;
  label: string;
  kind: 'num' | 'txt';
  a: string;
  b: string;
  delta: string;
  deltaClass: string;
  eq: boolean;
}
interface KpiMetric {
  key: string;
  label: string;
  tone: 'primary' | 'cap' | 'int' | 'cost';
  aVal: number;
  bVal: number;
  aMeta: string;
  bMeta: string;
}
interface DiffRow {
  lab: string;
  aV: number;
  bV: number;
  invert: boolean;
  unit: string;
  emphasis?: boolean;
  fmt?: (v: number) => string;
  deltaClass: string;
  aLeader: boolean;
  bLeader: boolean;
  deltaTxt: string;
  aTxt: string;
  bTxt: string;
}

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [CommonModule, DonutComponent, TrendChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cmp-view">
      <!-- HERO -->
      <header class="cmp-hero">
        <div class="cmp-hero-text">
          <div class="cmp-hero-tag">PORÓWNANIE OFERT</div>
          <h1 class="cmp-hero-title">
            Zestaw dwie kalkulacje obok siebie — zobacz różnicę w ratach i kosztach.
          </h1>
          <p class="cmp-hero-sub">
            Wybierz dwie zapisane oferty: oferta <b>A</b> jest bazą, oferta <b>B</b> jest
            porównywana. Wszystkie różnice (Δ) liczymy jako <span class="mono">B − A</span> — kolor
            podpowie, która jest tańsza.
          </p>
        </div>

        <div class="cmp-slots">
          <ng-container
            *ngTemplateOutlet="slotTpl; context: { side: 'A', offer: calc.offerA() }"
          ></ng-container>

          <button
            class="cmp-swap"
            (click)="calc.swapComparison()"
            title="Zamień strony (A ↔ B)"
            aria-label="Zamień strony"
          >
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path
                d="M4 7 L14 7 M11 4 L14 7 L11 10"
                stroke="currentColor"
                stroke-width="1.6"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M16 13 L6 13 M9 16 L6 13 L9 10"
                stroke="currentColor"
                stroke-width="1.6"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <ng-container
            *ngTemplateOutlet="slotTpl; context: { side: 'B', offer: calc.offerB() }"
          ></ng-container>
        </div>
      </header>

      <!-- EMPTY STATE -->
      @if (!calc.offerA() || !calc.offerB()) {
        <div class="cmp-empty">
          <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden="true">
            <rect
              x="6"
              y="14"
              width="30"
              height="52"
              rx="4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.4"
            />
            <rect
              x="44"
              y="14"
              width="30"
              height="52"
              rx="4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.4"
            />
            <path
              d="M12 24 L28 24 M12 32 L24 32 M12 40 L28 40 M12 48 L20 48"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
            />
            <path
              d="M50 24 L66 24 M50 32 L62 32 M50 40 L66 40 M50 48 L58 48"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
            />
            <path
              d="M38 38 L42 40 L38 42"
              stroke="currentColor"
              stroke-width="1.2"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <div class="cmp-empty-title">Wybierz dwie oferty do porównania</div>
          <div class="cmp-empty-sub">
            Każda strona przyjmuje jedną zapisaną kalkulację z zakładki <b>Twoje kalkulacje</b>.
            Liczby (rata, odsetki, koszty), wykresy i różnice pojawią się tutaj, gdy oba sloty będą
            wypełnione.
          </div>
          <div class="cmp-empty-actions">
            @if (!calc.offerA()) {
              <button class="btn btn--primary" (click)="openPicker('A')">+ Wybierz ofertę A</button>
            }
            @if (!calc.offerB()) {
              <button
                class="btn"
                [class.btn--primary]="calc.offerA()"
                [class.btn--ghost]="!calc.offerA()"
                (click)="openPicker('B')"
              >
                + Wybierz ofertę B
              </button>
            }
          </div>
        </div>
      } @else {
        <!-- TOOLBAR -->
        <div class="cmp-toolbar">
          <div class="cmp-toolbar-group">
            <span class="cmp-toolbar-lab muted small">Tryb wykresu trendu</span>
            <div class="seg seg--compact">
              <button
                class="seg-btn"
                [class.is-on]="calc.comparison().trendMode === 'overlay'"
                (click)="calc.setComparison({ trendMode: 'overlay' })"
              >
                nakładka
              </button>
              <button
                class="seg-btn"
                [class.is-on]="calc.comparison().trendMode === 'side-by-side'"
                (click)="calc.setComparison({ trendMode: 'side-by-side' })"
              >
                obok siebie
              </button>
            </div>
          </div>

          <label class="cmp-toolbar-toggle">
            <input
              type="checkbox"
              [checked]="calc.comparison().showZeroSegments"
              (change)="calc.setComparison({ showZeroSegments: $any($event.target).checked })"
            />
            <span class="switch-track"><span class="switch-thumb"></span></span>
            <span>Pokaż wykluczone segmenty</span>
          </label>

          <label class="cmp-toolbar-toggle">
            <input
              type="checkbox"
              [checked]="calc.comparison().diffOnly"
              (change)="calc.setComparison({ diffOnly: $any($event.target).checked })"
            />
            <span class="switch-track"><span class="switch-thumb"></span></span>
            <span>Tylko różnice (parametry)</span>
          </label>

          <div class="cmp-toolbar-spacer"></div>

          <button class="btn btn--ghost btn--mini" title="Drukuj porównanie">
            <svg width="13" height="13" viewBox="0 0 14 14">
              <path
                d="M4 5 L4 2 L10 2 L10 5 M4 11 L4 13 L10 13 L10 11 M2 5 L12 5 Q13 5 13 6 L13 9 Q13 10 12 10 L2 10 Q1 10 1 9 L1 6 Q1 5 2 5 Z M4 8 L10 8"
                stroke="currentColor"
                stroke-width="1.1"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Drukuj
          </button>
          <button class="btn btn--ghost btn--mini" title="Eksportuj porównanie do CSV">
            <svg width="13" height="13" viewBox="0 0 13 13">
              <path
                d="M6.5 2 L6.5 9 M3.5 6 L6.5 9 L9.5 6 M2 11 L11 11"
                stroke="currentColor"
                stroke-width="1.2"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Eksportuj CSV
          </button>
        </div>

        @if (calc.offerA()!.source.loanAmount !== calc.offerB()!.source.loanAmount) {
          <div class="cmp-banner cmp-banner--info">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.3" fill="none" />
              <path
                d="M7 4 L7 7.5 M7 9.5 L7 10"
                stroke="currentColor"
                stroke-width="1.3"
                stroke-linecap="round"
              />
            </svg>
            Oferty mają różne kwoty kredytu (<b>{{ fmt0(calc.offerA()!.source.loanAmount) }} zł</b>
            vs <b>{{ fmt0(calc.offerB()!.source.loanAmount) }} zł</b>) — porównuj ostrożnie.
          </div>
        }

        <!-- 3.3 PARAMS -->
        <section class="cmp-card cmp-card--params">
          <div class="cmp-card-head">
            <div>
              <div class="cmp-card-tag">3.3 · PARAMETRY WEJŚCIOWE</div>
              <h2 class="cmp-card-title">Co użytkownik zmienił między ofertami</h2>
            </div>
            <div class="cmp-diff-pill mono">
              {{ diffCount() }} z {{ paramRowsAll().length }} różnic
            </div>
          </div>

          <div class="cmp-params-tbl">
            <div class="cmp-params-head">
              <div>Parametr</div>
              <div class="cmp-col-a">
                <span class="cmp-col-badge cmp-col-badge--a">A</span> {{ calc.offerA()!.name }}
              </div>
              <div class="cmp-col-b">
                <span class="cmp-col-badge cmp-col-badge--b">B</span> {{ calc.offerB()!.name }}
              </div>
              <div class="cmp-col-delta">Δ <span class="muted small">(B − A)</span></div>
            </div>

            @if (paramGroups().length === 0) {
              <div class="cmp-params-empty muted small">
                Wszystkie parametry są identyczne. Wyłącz „Tylko różnice", aby zobaczyć całość.
              </div>
            }

            @for (g of paramGroups(); track g.group) {
              <div class="cmp-params-group">{{ g.group }}</div>
              @for (r of g.rows; track r.label) {
                <div class="cmp-params-row" [class.is-eq]="r.eq">
                  <div class="cmp-params-lab">{{ r.label }}</div>
                  <div class="cmp-params-val cmp-col-a mono">{{ r.a }}</div>
                  <div class="cmp-params-val cmp-col-b mono">{{ r.b }}</div>
                  <div class="cmp-params-delta cmp-col-delta mono" [ngClass]="r.deltaClass">
                    {{ r.delta }}
                  </div>
                </div>
              }
            }
          </div>
        </section>

        <!-- 3.4 KPI -->
        <section class="cmp-card cmp-card--kpi">
          <div class="cmp-card-head">
            <div>
              <div class="cmp-card-tag">3.4 · KLUCZOWE WSKAŹNIKI</div>
              <h2 class="cmp-card-title">
                Cztery wartości, na które patrzą banki — i Twój portfel
              </h2>
            </div>
            <div class="muted small">
              Zielony ✓ oznacza lidera w danej metryce (mniej = lepiej).
            </div>
          </div>

          <div class="cmp-kpi-grid">
            @for (m of kpiMetrics(); track m.key) {
              <div class="cmp-kpi-row" [ngClass]="'cmp-kpi-row--' + m.tone">
                <div class="cmp-kpi-card" [class.is-leader]="kpiALeader(m)">
                  <div class="cmp-kpi-corner cmp-kpi-corner--a">A</div>
                  @if (kpiALeader(m)) {
                    <div class="cmp-kpi-leader">✓ lider</div>
                  }
                  <div class="cmp-kpi-lab"><span class="kpi-dot"></span>{{ m.label }}</div>
                  <div class="cmp-kpi-val mono">
                    {{ fmt0(m.aVal) }}<span class="kpi-unit">zł</span>
                  </div>
                  <div class="cmp-kpi-meta">{{ m.aMeta }}</div>
                </div>

                <div class="cmp-kpi-delta" [ngClass]="kpiDeltaClass(m)">
                  <div class="cmp-kpi-delta-arrow">{{ kpiDeltaArrow(m) }}</div>
                  <div class="cmp-kpi-delta-val mono">
                    {{ kpiDeltaVal(m) }} <span class="muted">zł</span>
                  </div>
                  <div class="cmp-kpi-delta-pct mono">({{ kpiDeltaPct(m) }})</div>
                </div>

                <div class="cmp-kpi-card" [class.is-leader]="kpiBLeader(m)">
                  <div class="cmp-kpi-corner cmp-kpi-corner--b">B</div>
                  @if (kpiBLeader(m)) {
                    <div class="cmp-kpi-leader">✓ lider</div>
                  }
                  <div class="cmp-kpi-lab"><span class="kpi-dot"></span>{{ m.label }}</div>
                  <div class="cmp-kpi-val mono">
                    {{ fmt0(m.bVal) }}<span class="kpi-unit">zł</span>
                  </div>
                  <div class="cmp-kpi-meta">{{ m.bMeta }}</div>
                </div>
              </div>
            }
          </div>
        </section>

        <!-- 3.5 DONUT — ALL -->
        <section class="cmp-card cmp-card--donuts">
          <div class="cmp-card-head">
            <div>
              <div class="cmp-card-tag">3.5 · STRUKTURA WSZYSTKICH PŁATNOŚCI</div>
              <h2 class="cmp-card-title">Struktura wszystkich płatności</h2>
              <p class="cmp-card-sub">
                Z czego składa się łączny koszt finansowania w całym okresie.
              </p>
            </div>
            <ul class="cmp-donut-legend">
              <li><span class="dot" style="background:var(--c-cap)"></span>Kapitał</li>
              <li><span class="dot" style="background:var(--c-int)"></span>Odsetki</li>
              <li>
                <span class="dot" style="background:var(--c-cost)"></span>Koszty okołokredytowe
              </li>
              <li><span class="dot" style="background:var(--c-over)"></span>Nadpłaty</li>
            </ul>
          </div>

          <div class="cmp-donut-row">
            <div class="cmp-donut-col cmp-donut-col--a">
              <div class="cmp-donut-head">
                <span class="cmp-col-badge cmp-col-badge--a">A</span>
                <span class="cmp-donut-name">{{ calc.offerA()!.name }}</span>
              </div>
              <app-donut
                [data]="allDonutA()"
                [size]="180"
                [thickness]="26"
                centerLabel="Razem"
                [centerValue]="donutCenterA()"
              />
              <div class="cmp-donut-foot">
                <div class="muted small">Σ płatności</div>
                <div class="mono cmp-donut-total">
                  <b>{{ fmt0(calc.offerA()!.result.totalPayments) }}</b> zł
                </div>
              </div>
            </div>

            <div class="cmp-donut-delta">
              <div class="muted small cmp-donut-delta-lab">Δ segmentów</div>
              @for (d of allDonutDelta(); track d.label) {
                <div class="cmp-donut-delta-row">
                  <span class="dot" [style.background]="d.color"></span>
                  <span class="cmp-donut-delta-lab2">{{ d.label }}</span>
                  <span class="mono" [ngClass]="d.deltaClass">{{ d.delta }}</span>
                </div>
              }
            </div>

            <div class="cmp-donut-col cmp-donut-col--b">
              <div class="cmp-donut-head">
                <span class="cmp-col-badge cmp-col-badge--b">B</span>
                <span class="cmp-donut-name">{{ calc.offerB()!.name }}</span>
              </div>
              <app-donut
                [data]="allDonutB()"
                [size]="180"
                [thickness]="26"
                centerLabel="Razem"
                [centerValue]="donutCenterB()"
              />
              <div class="cmp-donut-foot">
                <div class="muted small">Σ płatności</div>
                <div class="mono cmp-donut-total">
                  <b>{{ fmt0(calc.offerB()!.result.totalPayments) }}</b> zł
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 3.6 DONUT — FIRST INSTALLMENT -->
        <section class="cmp-card cmp-card--donuts">
          <div class="cmp-card-head">
            <div>
              <div class="cmp-card-tag">3.6 · STRUKTURA PIERWSZEJ RATY</div>
              <h2 class="cmp-card-title">Struktura pierwszej raty</h2>
              <p class="cmp-card-sub">Jak rozkłada się kapitał i odsetki na starcie spłaty.</p>
            </div>
            <ul class="cmp-donut-legend">
              <li><span class="dot" style="background:var(--c-cap)"></span>Kapitał</li>
              <li><span class="dot" style="background:var(--c-int)"></span>Odsetki</li>
            </ul>
          </div>

          <div class="cmp-donut-row">
            <div class="cmp-donut-col cmp-donut-col--a">
              <div class="cmp-donut-head">
                <span class="cmp-col-badge cmp-col-badge--a">A</span>
                <span class="cmp-donut-name">{{ calc.offerA()!.name }}</span>
              </div>
              <app-donut
                [data]="firstDonutA()"
                [size]="150"
                [thickness]="22"
                centerLabel="rata"
                [centerValue]="fmt0(firstInstallmentA())"
              />
              <div class="cmp-donut-foot">
                <div class="muted small">pierwsza rata</div>
                <div class="mono cmp-donut-total">
                  <b>{{ fmt0(firstInstallmentA()) }}</b> zł
                </div>
              </div>
            </div>

            <div class="cmp-donut-delta">
              <div class="muted small cmp-donut-delta-lab">Δ segmentów</div>
              @for (d of firstDonutDelta(); track d.label) {
                <div class="cmp-donut-delta-row">
                  <span class="dot" [style.background]="d.color"></span>
                  <span class="cmp-donut-delta-lab2">{{ d.label }}</span>
                  <span class="mono" [ngClass]="d.deltaClass">{{ d.delta }}</span>
                </div>
              }
            </div>

            <div class="cmp-donut-col cmp-donut-col--b">
              <div class="cmp-donut-head">
                <span class="cmp-col-badge cmp-col-badge--b">B</span>
                <span class="cmp-donut-name">{{ calc.offerB()!.name }}</span>
              </div>
              <app-donut
                [data]="firstDonutB()"
                [size]="150"
                [thickness]="22"
                centerLabel="rata"
                [centerValue]="fmt0(firstInstallmentB())"
              />
              <div class="cmp-donut-foot">
                <div class="muted small">pierwsza rata</div>
                <div class="mono cmp-donut-total">
                  <b>{{ fmt0(firstInstallmentB()) }}</b> zł
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 3.7 TREND -->
        @if (calc.comparison().trendMode === 'overlay') {
          <section class="cmp-card cmp-card--trend">
            <div class="cmp-card-head">
              <div>
                <div class="cmp-card-tag">3.7 · HARMONOGRAM SPŁATY</div>
                <h2 class="cmp-card-title">Pozostało do spłaty — A vs B</h2>
                <p class="cmp-card-sub">
                  Oś X obejmuje unię lat obu ofert ({{ trendOverlay().minYear }}–{{
                    trendOverlay().maxYear
                  }}). Skala wspólna.
                </p>
              </div>
              <ul class="cmp-trend-legend">
                <li>
                  <svg width="22" height="6">
                    <line x1="1" y1="3" x2="21" y2="3" stroke="var(--offer-a)" stroke-width="2.4" />
                  </svg>
                  A: {{ calc.offerA()!.name }}
                </li>
                <li>
                  <svg width="22" height="6">
                    <line
                      x1="1"
                      y1="3"
                      x2="21"
                      y2="3"
                      stroke="var(--offer-b)"
                      stroke-width="2.4"
                      stroke-dasharray="3 3"
                    />
                  </svg>
                  B: {{ calc.offerB()!.name }}
                </li>
              </ul>
            </div>

            @if (trendOverlay(); as o) {
              <svg
                [attr.viewBox]="'0 0 ' + o.w + ' ' + o.h"
                class="trend-chart trend-chart--combo"
                preserveAspectRatio="none"
              >
                @for (t of o.ticks; track t.value) {
                  <line
                    [attr.x1]="o.padL"
                    [attr.x2]="o.w - o.padR"
                    [attr.y1]="t.y"
                    [attr.y2]="t.y"
                    stroke="var(--grid)"
                    stroke-dasharray="2 4"
                  />
                  <text
                    [attr.x]="o.padL - 10"
                    [attr.y]="t.y + 3"
                    class="ax-label"
                    text-anchor="end"
                  >
                    {{ t.label }}
                  </text>
                }

                <text
                  [attr.x]="o.padL - 70"
                  [attr.y]="o.padT + o.innerH / 2"
                  [attr.transform]="
                    'rotate(-90 ' + (o.padL - 70) + ' ' + (o.padT + o.innerH / 2) + ')'
                  "
                  class="ax-title"
                  text-anchor="middle"
                >
                  Kwota pozostała do spłaty
                </text>

                <!-- B (dashed) -->
                <path
                  [attr.d]="o.pathB"
                  fill="none"
                  stroke="var(--offer-b)"
                  stroke-width="2.4"
                  stroke-dasharray="6 5"
                  stroke-linejoin="round"
                  stroke-linecap="round"
                />
                @for (p of o.ptsBVisible; track $index) {
                  <circle
                    [attr.cx]="p.x"
                    [attr.cy]="p.y"
                    r="3.5"
                    fill="var(--surface)"
                    stroke="var(--offer-b)"
                    stroke-width="1.8"
                  />
                }
                <!-- A (solid) -->
                <path
                  [attr.d]="o.pathA"
                  fill="none"
                  stroke="var(--offer-a)"
                  stroke-width="2.4"
                  stroke-linejoin="round"
                  stroke-linecap="round"
                />
                @for (p of o.ptsAVisible; track $index) {
                  <circle
                    [attr.cx]="p.x"
                    [attr.cy]="p.y"
                    r="3.5"
                    fill="var(--offer-a)"
                    stroke="var(--surface)"
                    stroke-width="1.5"
                  />
                }

                @for (t of o.xTicks; track t.year) {
                  <text
                    [attr.x]="t.x"
                    [attr.y]="o.padT + o.innerH + 10"
                    [attr.transform]="'rotate(-90 ' + t.x + ' ' + (o.padT + o.innerH + 10) + ')'"
                    class="ax-label"
                    text-anchor="end"
                  >
                    {{ t.year }}
                  </text>
                }

                <line
                  [attr.x1]="o.padL"
                  [attr.x2]="o.w - o.padR"
                  [attr.y1]="o.padT + o.innerH"
                  [attr.y2]="o.padT + o.innerH"
                  stroke="var(--line-2)"
                />
              </svg>
            }
          </section>
        } @else {
          <section class="cmp-card cmp-card--trend">
            <div class="cmp-card-head">
              <div>
                <div class="cmp-card-tag">3.7 · HARMONOGRAM SPŁATY</div>
                <h2 class="cmp-card-title">Pełny rozkład — oferta A obok oferty B</h2>
                <p class="cmp-card-sub">
                  Oba wykresy mają wspólną skalę osi, aby porównanie kształtów było uczciwe.
                </p>
              </div>
            </div>
            <div class="cmp-trend-side">
              <div class="cmp-trend-side-card cmp-trend-side-card--a">
                <div class="cmp-trend-side-head">
                  <span class="cmp-col-badge cmp-col-badge--a">A</span>
                  <span class="cmp-donut-name">{{ calc.offerA()!.name }}</span>
                </div>
                <div class="muted small">Mini-wykres salda (obok-siebie).</div>
              </div>
              <div class="cmp-trend-side-card cmp-trend-side-card--b">
                <div class="cmp-trend-side-head">
                  <span class="cmp-col-badge cmp-col-badge--b">B</span>
                  <span class="cmp-donut-name">{{ calc.offerB()!.name }}</span>
                </div>
                <div class="muted small">Mini-wykres salda (obok-siebie).</div>
              </div>
            </div>
          </section>
        }

        <!-- 3.8 DIFF TABLE -->
        <section class="cmp-card cmp-card--diff">
          <div class="cmp-card-head">
            <div>
              <div class="cmp-card-tag">3.8 · TABELA RÓŻNIC KOSZTOWYCH</div>
              <h2 class="cmp-card-title">Co konkretnie kosztuje więcej, a co mniej</h2>
            </div>
          </div>

          <div class="cmp-diff-tbl">
            <div class="cmp-diff-head">
              <div>Pozycja</div>
              <div class="cmp-col-a">
                <span class="cmp-col-badge cmp-col-badge--a">A</span> Oferta A
              </div>
              <div class="cmp-col-b">
                <span class="cmp-col-badge cmp-col-badge--b">B</span> Oferta B
              </div>
              <div class="cmp-col-delta">Δ <span class="muted small">(B − A)</span></div>
            </div>
            @for (r of diffRows(); track r.lab) {
              <div class="cmp-diff-row" [class.is-sum]="r.emphasis">
                <div class="cmp-diff-lab">{{ r.lab }}</div>
                <div class="cmp-diff-val cmp-col-a mono" [class.is-leader]="r.aLeader">
                  @if (r.aLeader) {
                    <span class="cmp-diff-marker"></span>
                  }
                  {{ r.aTxt }} {{ r.unit }}
                </div>
                <div class="cmp-diff-val cmp-col-b mono" [class.is-leader]="r.bLeader">
                  @if (r.bLeader) {
                    <span class="cmp-diff-marker"></span>
                  }
                  {{ r.bTxt }} {{ r.unit }}
                </div>
                <div class="cmp-diff-delta cmp-col-delta mono" [ngClass]="r.deltaClass">
                  {{ r.deltaTxt }}
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- PICKER POPOVER -->
      @if (pickerSlot(); as slot) {
        <div class="cmp-picker-mask" (click)="closePicker()">
          <div class="cmp-picker" (click)="$event.stopPropagation()">
            <div class="cmp-picker-head">
              <div>
                <div class="cmp-picker-tag">Slot {{ slot }}</div>
                <h3>Wybierz ofertę</h3>
              </div>
              <button class="sc-modal-close" (click)="closePicker()" aria-label="Zamknij">×</button>
            </div>
            <ul class="cmp-picker-list">
              @for (o of calc.availableOffers(); track o.id) {
                <li>
                  <button
                    class="cmp-picker-row"
                    [class.is-blocked]="isBlocked(o, slot)"
                    [class.is-active]="isCurrent(o, slot)"
                    [disabled]="isBlocked(o, slot)"
                    (click)="pick(o.id, slot)"
                  >
                    <div class="cmp-picker-row-main">
                      <div class="cmp-picker-row-name">
                        {{ o.name }}
                        @if (isCurrent(o, slot)) {
                          <span class="cmp-picker-now">obecnie</span>
                        }
                        @if (isBlocked(o, slot)) {
                          <span class="cmp-picker-blocked">już po drugiej stronie</span>
                        }
                      </div>
                      <div class="cmp-picker-row-meta mono muted small">
                        {{ fmt0(o.source.loanAmount) }} zł ·
                        {{ periodTxt(o.source.years, o.source.months) }} ·
                        {{ fmtPct(o.source.rate, 2) }}%
                      </div>
                    </div>
                    <div class="cmp-picker-row-rata mono">
                      <b>{{ fmt0(o.result.firstInstallment) }} zł</b>
                      <div class="muted small">pierwsza rata</div>
                    </div>
                  </button>
                </li>
              }
            </ul>
          </div>
        </div>
      }

      <!-- SLOT TEMPLATE -->
      <ng-template #slotTpl let-side="side" let-offer="offer">
        @if (offer) {
          <div class="cmp-slot cmp-slot--filled" [ngClass]="'cmp-slot--' + lower(side)">
            <span class="cmp-slot-badge" [ngClass]="'cmp-slot-badge--' + lower(side)">{{
              side
            }}</span>
            <button class="cmp-slot-body" (click)="openPicker(side)" title="Zmień ofertę">
              <div class="cmp-slot-name">{{ offer.name }}</div>
              <div class="cmp-slot-meta mono">
                <span>{{ fmt0(offer.source.loanAmount) }} zł</span>
                <span class="cmp-dot-sep">·</span>
                <span>{{ periodTxt(offer.source.years, offer.source.months) }}</span>
                <span class="cmp-dot-sep">·</span>
                <span>{{ fmtPct(offer.source.rate, 2) }}%</span>
                <span class="cmp-dot-sep">·</span>
                <span>rata {{ fmt0(offer.result.firstInstallment) }} zł</span>
              </div>
            </button>
            <div class="cmp-slot-actions">
              <button class="cmp-slot-link" title="Otwórz w kalkulatorze">
                <svg width="11" height="11" viewBox="0 0 12 12">
                  <path
                    d="M2 6 L10 6 M7 3 L10 6 L7 9"
                    stroke="currentColor"
                    stroke-width="1.5"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                Otwórz
              </button>
              <button
                class="cmp-slot-clear"
                (click)="clearSlot($event, side)"
                title="Wyczyść slot"
                aria-label="Wyczyść"
              >
                ×
              </button>
            </div>
          </div>
        } @else {
          <button
            class="cmp-slot cmp-slot--empty"
            [ngClass]="'cmp-slot--' + lower(side)"
            (click)="openPicker(side)"
          >
            <span class="cmp-slot-badge" [ngClass]="'cmp-slot-badge--' + lower(side)">{{
              side
            }}</span>
            <span class="cmp-slot-placeholder">+ Wybierz ofertę</span>
          </button>
        }
      </ng-template>
    </div>
  `,
})
export class ComparisonComponent {
  calc = inject(CalcService);

  pickerSlot = signal<'A' | 'B' | null>(null);

  /* ============ helpers do template ============ */
  fmt0 = fmt0;
  fmt2 = fmt2;
  fmtPct = fmtPct;
  periodTxt = periodTxt;
  lower(s: string) {
    return s.toLowerCase();
  }
  openPicker(side: 'A' | 'B') {
    this.pickerSlot.set(side);
  }
  closePicker() {
    this.pickerSlot.set(null);
  }
  isBlocked(o: Offer, slot: 'A' | 'B') {
    const c = this.calc.comparison();
    return slot === 'A' ? o.id === c.offerBId : o.id === c.offerAId;
  }
  isCurrent(o: Offer, slot: 'A' | 'B') {
    const c = this.calc.comparison();
    return slot === 'A' ? o.id === c.offerAId : o.id === c.offerBId;
  }
  pick(id: string, slot: 'A' | 'B') {
    if (slot === 'A') this.calc.setComparison({ offerAId: id });
    else this.calc.setComparison({ offerBId: id });
    this.pickerSlot.set(null);
  }
  clearSlot(ev: MouseEvent, side: 'A' | 'B') {
    ev.stopPropagation();
    if (side === 'A') this.calc.setComparison({ offerAId: null });
    else this.calc.setComparison({ offerBId: null });
  }
  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.pickerSlot()) this.pickerSlot.set(null);
  }

  /* ============ Parametry (3.3) ============ */
  paramRowsAll = computed<ParamRow[]>(() => {
    const a = this.calc.offerA();
    const b = this.calc.offerB();
    if (!a || !b) return [];
    const ai = a.source,
      bi = b.source;
    const out: ParamRow[] = [];

    const numRow = (
      group: string,
      label: string,
      av: number,
      bv: number,
      fmtFn: (v: number) => string = fmt0,
      unit = 'zł',
      invert = false,
    ): ParamRow => {
      const d = bv - av;
      const eq = Math.abs(d) < 0.5;
      const u = unit ? ' ' + unit : '';
      return {
        group,
        label,
        kind: 'num',
        a: fmtFn(av) + u,
        b: fmtFn(bv) + u,
        delta: eq ? '=' : `${sign(d)}${fmtFn(Math.abs(d))}${u}`,
        deltaClass: 'cmp-delta--' + deltaKind(d, invert),
        eq,
      };
    };
    const pctRow = (group: string, label: string, av: number, bv: number): ParamRow => {
      const d = bv - av;
      const eq = Math.abs(d) < 0.005;
      return {
        group,
        label,
        kind: 'num',
        a: fmtPct(av, 2) + ' %',
        b: fmtPct(bv, 2) + ' %',
        delta: eq ? '=' : `${sign(d)}${fmtPct(Math.abs(d), 2)} pp`,
        deltaClass: 'cmp-delta--' + deltaKind(d),
        eq,
      };
    };
    const txtRow = (group: string, label: string, av: string, bv: string): ParamRow => {
      const eq = av === bv;
      return {
        group,
        label,
        kind: 'txt',
        a: av,
        b: bv,
        delta: eq ? '=' : '≠',
        deltaClass: eq ? 'cmp-delta--eq' : 'cmp-delta--neq',
        eq,
      };
    };
    const periodRow = (): ParamRow => {
      const am = ai.years * 12 + ai.months,
        bm = bi.years * 12 + bi.months;
      const d = bm - am;
      const eq = d === 0;
      return {
        group: 'Dane podstawowe',
        label: 'Okres kredytowania',
        kind: 'num',
        a: periodTxt(ai.years, ai.months),
        b: periodTxt(bi.years, bi.months),
        delta: eq ? '=' : `${sign(d)}${Math.abs(d)} m-cy`,
        deltaClass: 'cmp-delta--' + deltaKind(d),
        eq,
      };
    };
    const dateRow = (label: string, ad: Date, bd: Date): ParamRow => {
      const dm = (bd.getFullYear() - ad.getFullYear()) * 12 + (bd.getMonth() - ad.getMonth());
      const eq = dm === 0;
      return {
        group: 'Dane podstawowe',
        label,
        kind: 'num',
        a: monthLabel(ad),
        b: monthLabel(bd),
        delta: eq ? '=' : `${sign(dm)}${Math.abs(dm)} m-cy`,
        deltaClass: 'cmp-delta--' + deltaKind(dm),
        eq,
      };
    };

    out.push(
      numRow('Dane podstawowe', 'Wartość nieruchomości', ai.propertyValue, bi.propertyValue),
    );
    out.push(numRow('Dane podstawowe', 'Kwota kredytu', ai.loanAmount, bi.loanAmount));
    out.push(
      pctRow(
        'Dane podstawowe',
        'LTV',
        (ai.loanAmount / ai.propertyValue) * 100,
        (bi.loanAmount / bi.propertyValue) * 100,
      ),
    );
    out.push(periodRow());
    out.push(dateRow('Data uruchomienia', a.startDate, b.startDate));
    out.push(txtRow('Dane podstawowe', 'Tryb rat', ai.installmentType, bi.installmentType));
    out.push(txtRow('Dane podstawowe', 'Rodzaj stopy', ai.rateType, bi.rateType));
    out.push(pctRow('Dane podstawowe', 'Oprocentowanie nominalne (start)', ai.rate, bi.rate));
    if (ai.rateType === 'zmienna' || bi.rateType === 'zmienna') {
      out.push(pctRow('Dane podstawowe', 'WIBOR', ai.wibor, bi.wibor));
      out.push(pctRow('Dane podstawowe', 'Marża', ai.margin, bi.margin));
    }
    out.push(numRow('Koszty', 'Prowizja za udzielenie', a.result.commission, b.result.commission));
    out.push(numRow('Koszty', 'Opłata za wycenę', a.result.valuationFee, b.result.valuationFee));
    out.push(
      txtRow(
        'Nadpłaty',
        'Reguła nadpłat (miesięczna)',
        ai.overpaymentsEnabled ? '1 000 zł / m-c' : 'brak',
        bi.overpaymentsEnabled ? '1 000 zł / m-c' : 'brak',
      ),
    );
    out.push(numRow('Transze', 'Liczba transz', ai.tranches, bi.tranches, (v) => String(v), ''));
    return out;
  });
  diffCount = computed(() => this.paramRowsAll().filter((r) => !r.eq).length);
  paramGroups = computed(() => {
    const rows = this.calc.comparison().diffOnly
      ? this.paramRowsAll().filter((r) => !r.eq)
      : this.paramRowsAll();
    const groups: { group: string; rows: ParamRow[] }[] = [];
    for (const r of rows) {
      let g = groups.find((x) => x.group === r.group);
      if (!g) {
        g = { group: r.group, rows: [] };
        groups.push(g);
      }
      g.rows.push(r);
    }
    return groups;
  });

  /* ============ KPI (3.4) ============ */
  kpiMetrics = computed<KpiMetric[]>(() => {
    const a = this.calc.offerA();
    const b = this.calc.offerB();
    if (!a || !b) return [];
    const ai = a.source,
      bi = b.source,
      ar = a.result,
      br = b.result;
    return [
      {
        key: 'first',
        label: 'Pierwsza rata',
        tone: 'primary',
        aVal: ar.firstInstallment,
        bVal: br.firstInstallment,
        aMeta: `${ai.installmentType} · ${ai.rateType} ${fmtPct(ai.rate, 2)}%`,
        bMeta: `${bi.installmentType} · ${bi.rateType} ${fmtPct(bi.rate, 2)}%`,
      },
      {
        key: 'total',
        label: 'Suma wszystkich płatności',
        tone: 'cap',
        aVal: ar.totalPayments,
        bVal: br.totalPayments,
        aMeta: `oddasz ${fmtPct((ar.totalPayments / ai.loanAmount) * 100, 0)}% pożyczonej kwoty`,
        bMeta: `oddasz ${fmtPct((br.totalPayments / bi.loanAmount) * 100, 0)}% pożyczonej kwoty`,
      },
      {
        key: 'int',
        label: 'Odsetki',
        tone: 'int',
        aVal: ar.totalInterest,
        bVal: br.totalInterest,
        aMeta: `${fmtPct((ar.totalInterest / ai.loanAmount) * 100, 1)}% od kapitału`,
        bMeta: `${fmtPct((br.totalInterest / bi.loanAmount) * 100, 1)}% od kapitału`,
      },
      {
        key: 'costs',
        label: 'Koszty okołokredytowe',
        tone: 'cost',
        aVal: ar.totalCosts,
        bVal: br.totalCosts,
        aMeta: `prowizja ${fmt0(ar.commission)} · wycena ${fmt0(ar.valuationFee)}`,
        bMeta: `prowizja ${fmt0(br.commission)} · wycena ${fmt0(br.valuationFee)}`,
      },
    ];
  });
  kpiALeader = (m: KpiMetric) => m.bVal > m.aVal && Math.abs(m.bVal - m.aVal) > 0.5;
  kpiBLeader = (m: KpiMetric) => m.aVal > m.bVal && Math.abs(m.bVal - m.aVal) > 0.5;
  kpiDeltaClass = (m: KpiMetric) => 'cmp-delta--' + deltaKind(m.bVal - m.aVal);
  kpiDeltaArrow = (m: KpiMetric) => {
    const d = m.bVal - m.aVal;
    return Math.abs(d) < 0.5 ? '=' : d > 0 ? '↑' : '↓';
  };
  kpiDeltaVal = (m: KpiMetric) => {
    const d = m.bVal - m.aVal;
    return `${sign(d)}${fmt0(Math.abs(d))}`;
  };
  kpiDeltaPct = (m: KpiMetric) => {
    const d = m.bVal - m.aVal;
    const pct = m.aVal ? (d / m.aVal) * 100 : 0;
    return `${sign(d)}${fmtPct(Math.abs(pct), 1)}%`;
  };

  /* ============ Donuts (3.5 / 3.6) ============ */
  private allSegs(o: Offer): DonutSlice[] {
    return [
      { label: 'Kapitał', value: o.source.loanAmount, color: 'var(--c-cap)' },
      { label: 'Odsetki', value: o.result.totalInterest, color: 'var(--c-int)' },
      { label: 'Koszty okołokredytowe', value: o.result.totalCosts, color: 'var(--c-cost)' },
      { label: 'Nadpłaty', value: o.result.totalOverpayments, color: 'var(--c-over)' },
    ];
  }
  private firstSegs(o: Offer): DonutSlice[] {
    const r0 = o.result.rows[0];
    return [
      { label: 'Kapitał', value: r0?.principal || 0, color: 'var(--c-cap)' },
      { label: 'Odsetki', value: r0?.interest || 0, color: 'var(--c-int)' },
    ];
  }
  private filterZero(segs: DonutSlice[]): DonutSlice[] {
    return this.calc.comparison().showZeroSegments ? segs : segs.filter((s) => s.value > 0.5);
  }
  allDonutA = computed(() => this.filterZero(this.allSegs(this.calc.offerA()!)));
  allDonutB = computed(() => this.filterZero(this.allSegs(this.calc.offerB()!)));
  firstDonutA = computed(() => this.filterZero(this.firstSegs(this.calc.offerA()!)));
  firstDonutB = computed(() => this.filterZero(this.firstSegs(this.calc.offerB()!)));
  donutCenterA = computed(() => {
    const t = this.allSegs(this.calc.offerA()!).reduce((s, x) => s + x.value, 0);
    return `${(t / 1000).toFixed(0)}k`;
  });
  donutCenterB = computed(() => {
    const t = this.allSegs(this.calc.offerB()!).reduce((s, x) => s + x.value, 0);
    return `${(t / 1000).toFixed(0)}k`;
  });
  firstInstallmentA = computed(() => this.calc.offerA()!.result.rows[0]?.rata ?? 0);
  firstInstallmentB = computed(() => this.calc.offerB()!.result.rows[0]?.rata ?? 0);

  allDonutDelta = computed(() =>
    this.donutDeltaRows(this.allSegs(this.calc.offerA()!), this.allSegs(this.calc.offerB()!)),
  );
  firstDonutDelta = computed(() =>
    this.donutDeltaRows(this.firstSegs(this.calc.offerA()!), this.firstSegs(this.calc.offerB()!)),
  );
  private donutDeltaRows(segA: DonutSlice[], segB: DonutSlice[]) {
    return segA.map((sa) => {
      const sb = segB.find((s) => s.label === sa.label) || {
        value: 0,
        color: sa.color,
        label: sa.label,
      };
      const d = sb.value - sa.value;
      const invert = sa.label === 'Nadpłaty';
      return {
        label: sa.label,
        color: sa.color,
        delta: Math.abs(d) < 0.5 ? '=' : `${sign(d)}${fmt0(Math.abs(d))} zł`,
        deltaClass: 'cmp-delta--' + deltaKind(d, invert),
      };
    });
  }

  /* ============ Trend overlay (3.7) ============ */
  trendOverlay = computed(() => {
    const a = this.calc.offerA();
    const b = this.calc.offerB();
    if (!a || !b) return null;
    const ar = a.result,
      br = b.result;
    const minYear = Math.min(ar.yearly[0]?.year ?? 0, br.yearly[0]?.year ?? 0);
    const maxYear = Math.max(
      ar.yearly[ar.yearly.length - 1]?.year ?? 0,
      br.yearly[br.yearly.length - 1]?.year ?? 0,
    );
    const yearsAxis: number[] = [];
    for (let y = minYear; y <= maxYear; y++) yearsAxis.push(y);

    const balByYear = (yearly: typeof ar.yearly, year: number) => {
      const found = yearly.find((yr) => yr.year === year);
      if (found) return found.balance;
      if (year < (yearly[0]?.year ?? 0)) return a.source.loanAmount;
      return 0;
    };
    const startBalA =
      (ar.rows[0]?.balance ?? 0) + (ar.rows[0]?.principal ?? 0) + (ar.rows[0]?.overpayment ?? 0);
    const startBalB =
      (br.rows[0]?.balance ?? 0) + (br.rows[0]?.principal ?? 0) + (br.rows[0]?.overpayment ?? 0);
    const maxBal = Math.max(startBalA, startBalB);
    const yMax = Math.ceil(maxBal / 50000) * 50000;

    const w = 1100,
      h = 360;
    const padL = 92,
      padR = 92,
      padT = 28,
      padB = 56;
    const innerW = w - padL - padR,
      innerH = h - padT - padB;
    const n = yearsAxis.length;
    const groupW = innerW / Math.max(1, n);
    const xCenter = (i: number) => padL + groupW * (i + 0.5);
    const yScale = (v: number) => padT + innerH - (v / yMax) * innerH;

    const ticks: { value: number; y: number; label: string }[] = [];
    for (let v = 0; v <= yMax + 0.5; v += 50000) {
      ticks.push({
        value: v,
        y: yScale(v),
        label: new Intl.NumberFormat('pl-PL').format(v) + ' zł',
      });
    }
    const ptsA = [
      { x: padL, y: yScale(startBalA), year: null as number | null },
      ...yearsAxis.map((y, i) => ({ x: xCenter(i), y: yScale(balByYear(ar.yearly, y)), year: y })),
    ];
    const ptsB = [
      { x: padL, y: yScale(startBalB), year: null as number | null },
      ...yearsAxis.map((y, i) => ({ x: xCenter(i), y: yScale(balByYear(br.yearly, y)), year: y })),
    ];
    const path = (pts: typeof ptsA) =>
      pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

    const xTicks = yearsAxis.map((y, i) => ({ year: y, x: xCenter(i) }));

    return {
      w,
      h,
      padL,
      padR,
      padT,
      padB,
      innerW,
      innerH,
      minYear,
      maxYear,
      ticks,
      xTicks,
      pathA: path(ptsA),
      pathB: path(ptsB),
      ptsAVisible: ptsA.slice(1),
      ptsBVisible: ptsB.slice(1),
    };
  });

  /* ============ Diff table (3.8) ============ */
  diffRows = computed<DiffRow[]>(() => {
    const a = this.calc.offerA();
    const b = this.calc.offerB();
    if (!a || !b) return [];
    const ar = a.result,
      br = b.result;
    const insA = Math.max(0, ar.totalCosts - ar.commission - ar.valuationFee);
    const insB = Math.max(0, br.totalCosts - br.commission - br.valuationFee);
    const oddasA = (ar.totalPayments / a.source.loanAmount) * 100;
    const oddasB = (br.totalPayments / b.source.loanAmount) * 100;

    const make = (
      lab: string,
      aV: number,
      bV: number,
      opts: {
        invert?: boolean;
        unit?: string;
        emphasis?: boolean;
        fmt?: (v: number) => string;
      } = {},
    ): DiffRow => {
      const invert = !!opts.invert;
      const unit = opts.unit ?? 'zł';
      const fmtFn = opts.fmt ?? fmt0;
      const d = bV - aV;
      const k = deltaKind(d, invert);
      const aLeader = (invert ? aV > bV : aV < bV) && Math.abs(d) > 0.5;
      const bLeader = (invert ? bV > aV : bV < aV) && Math.abs(d) > 0.5;
      return {
        lab,
        aV,
        bV,
        invert,
        unit,
        emphasis: opts.emphasis,
        fmt: fmtFn,
        deltaClass: 'cmp-delta--' + k,
        aLeader,
        bLeader,
        aTxt: fmtFn(aV),
        bTxt: fmtFn(bV),
        deltaTxt: Math.abs(d) < 0.5 ? '=' : `${sign(d)}${fmtFn(Math.abs(d))} ${unit}`,
      };
    };
    return [
      make('Kapitał', a.source.loanAmount, b.source.loanAmount),
      make('Odsetki — łącznie', ar.totalInterest, br.totalInterest),
      make('Prowizja za udzielenie', ar.commission, br.commission),
      make('Opłata za wycenę', ar.valuationFee, br.valuationFee),
      make('Ubezpieczenia (wszystkie)', insA, insB),
      make('Nadpłaty', ar.totalOverpayments, br.totalOverpayments, { invert: true }),
      make('SUMA — całkowity koszt kredytu', ar.totalPayments, br.totalPayments, {
        emphasis: true,
      }),
      make('Oddasz do banku', oddasA, oddasB, {
        emphasis: true,
        unit: '%',
        fmt: (v) => fmtPct(v, 1),
      }),
    ];
  });
}
