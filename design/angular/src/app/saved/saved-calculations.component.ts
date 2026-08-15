import { Component, ChangeDetectionStrategy, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalcService, fmtPLN } from '../calc.service';
import { SavedCalculation, SavedCalcFilter, SavedCalcSort } from '../models';

const fmtPct = (v: number, dec = 2) =>
  new Intl.NumberFormat('pl-PL', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v);

function relativeTime(d: Date): string {
  const now = new Date(2026, 4, 15, 10, 0);
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'przed chwilą';
  if (diff < 3600) return `${Math.round(diff / 60)} min temu`;
  if (diff < 86400) return `${Math.round(diff / 3600)} godz. temu`;
  if (diff < 86400 * 2) return 'wczoraj';
  if (diff < 86400 * 7) return `${Math.round(diff / 86400)} dni temu`;
  if (diff < 86400 * 30) return `${Math.round(diff / 86400 / 7)} tyg. temu`;
  return `${Math.round(diff / 86400 / 30)} mies. temu`;
}

function exactDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ============================================================
   Saved Calculations — widok główny
   ============================================================ */
@Component({
  selector: 'app-saved-calculations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="saved-view">
      <!-- HERO -->
      <header class="sc-hero">
        <div class="sc-hero-text">
          <h1 class="sc-hero-title">Zapisane kalkulacje</h1>
          <div class="sc-hero-meta">
            <span><b class="mono">{{ stats().total }}</b> zapisanych</span>
            <span><b class="mono">{{ stats().fav }}</b> ulubionych</span>
            <span><b class="mono">{{ stats().work }}</b> roboczych</span>
            <span class="sc-hero-meta-time">ostatnia zmiana {{ relativeTime(stats().lastUpdated) }}</span>
          </div>
        </div>
        <div class="sc-hero-actions">
          <button class="btn btn--primary sc-hero-btn">
            <svg width="13" height="13" viewBox="0 0 13 13"><path d="M6.5 2 L6.5 11 M2 6.5 L11 6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            Nowa kalkulacja
          </button>
          <button class="btn btn--ghost sc-hero-btn">
            <svg width="13" height="13" viewBox="0 0 13 13"><path d="M6.5 2 L6.5 9 M3.5 6 L6.5 9 L9.5 6 M2 11 L11 11" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Importuj
          </button>
          <button class="btn btn--ghost sc-hero-btn">
            <svg width="13" height="13" viewBox="0 0 13 13"><rect x="2" y="3" width="9" height="7.5" rx="1" stroke="currentColor" stroke-width="1.1" fill="none"/><path d="M4.5 5.5 L8.5 5.5 M4.5 7.5 L7 7.5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>
            Porównaj wybrane
          </button>
        </div>
      </header>

      <!-- TOOLBAR -->
      <div class="sc-toolbar">
        <div class="sc-search">
          <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="6" cy="6" r="3.5" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M9 9 L12 12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          <input type="text" placeholder="Szukaj po nazwie lub notatce…"
            [ngModel]="search()" (ngModelChange)="search.set($event)"/>
          @if (search()) {
            <button class="sc-search-clear" (click)="search.set('')" aria-label="Wyczyść">×</button>
          }
        </div>

        <div class="sc-filter-tabs">
          @for (f of filters; track f.id) {
            <button class="sc-filter" [class.is-on]="filter() === f.id" (click)="filter.set(f.id)">
              {{ f.label }}<span class="sc-filter-n mono">{{ filterCount(f.id) }}</span>
            </button>
          }
        </div>

        <div class="sc-sort">
          <span class="muted small">Sortuj:</span>
          <div class="sel sel--compact">
            <select [ngModel]="sortBy()" (ngModelChange)="sortBy.set($event)">
              <option value="updated">ostatnio zmodyfikowane</option>
              <option value="created">data utworzenia</option>
              <option value="name">nazwa (A–Z)</option>
              <option value="loan">kwota kredytu</option>
              <option value="rata">wysokość raty</option>
            </select>
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 4 L6 8 L10 4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
          </div>
        </div>
      </div>

      <!-- TABLE -->
      <div class="sc-table">
        <div class="sc-table-head">
          <div class="sc-cell sc-cell--name">Nazwa</div>
          <div class="sc-cell sc-cell--money">Kwota · LTV</div>
          <div class="sc-cell sc-cell--period">Okres</div>
          <div class="sc-cell sc-cell--rate">Oproc.</div>
          <div class="sc-cell sc-cell--rata">Pierwsza rata</div>
          <div class="sc-cell sc-cell--int"><span class="sc-int-dot"></span>Odsetki</div>
          <div class="sc-cell sc-cell--chart">Przebieg salda</div>
          <div class="sc-cell sc-cell--date">Zmodyfikowano</div>
          <div class="sc-cell sc-cell--actions">Akcje</div>
        </div>

        @if (filtered().length === 0) {
          <div class="sc-empty">
            <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
              <rect x="6" y="10" width="36" height="32" rx="3" stroke="currentColor" stroke-width="1.5" fill="none"/>
              <path d="M6 18 L42 18 M14 6 L14 12 M34 6 L34 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M16 28 L22 28 M16 34 L26 34" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            <div class="sc-empty-title">Brak pasujących kalkulacji</div>
            <div class="sc-empty-sub">Zmień filtry albo wyczyść pole szukania, aby zobaczyć wszystkie zapisane warianty.</div>
            @if (search() || filter() !== 'all') {
              <button class="btn btn--ghost" (click)="clearFilters()">Wyczyść filtry</button>
            }
          </div>
        } @else {
          @for (c of filtered(); track c.id) {
            <div class="sc-row" [class.sc-row--active]="c.id === calc.activeCalculationId()">
              <div class="sc-row-marker" aria-hidden="true"></div>

              <!-- Nazwa -->
              <div class="sc-cell sc-cell--name">
                <button class="sc-fav" [class.is-on]="c.tag === 'ulubiona'"
                  (click)="calc.toggleFavSavedCalc(c.id)"
                  [title]="c.tag === 'ulubiona' ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'">
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <path d="M7 1.5 L8.6 5 L12.4 5.4 L9.6 8 L10.4 12 L7 10 L3.6 12 L4.4 8 L1.6 5.4 L5.4 5 Z"
                      [attr.fill]="c.tag === 'ulubiona' ? 'var(--c-cost)' : 'transparent'"
                      [attr.stroke]="c.tag === 'ulubiona' ? 'var(--c-cost)' : 'currentColor'"
                      stroke-width="1.1" stroke-linejoin="round"/>
                  </svg>
                </button>
                <div class="sc-name-block">
                  <div class="sc-name-row">
                    <span class="sc-name">{{ c.name }}</span>
                    @if (c.tag === 'robocza') {
                      <span class="sc-tag sc-tag--robocza">robocza</span>
                    }
                    @if (c.id === calc.activeCalculationId()) {
                      <span class="sc-tag sc-tag--wczytana">wczytana</span>
                    }
                  </div>
                  @if (c.note) {
                    <div class="sc-note">„{{ c.note }}"</div>
                  }
                </div>
              </div>

              <!-- Kwota / LTV -->
              <div class="sc-cell sc-cell--money">
                <div class="sc-money mono"><b>{{ fmtPLN0(c.loanAmount) }}</b><span class="sc-unit">zł</span></div>
                <div class="sc-money-sub">
                  <span class="muted">z {{ fmtPLN0(c.propertyValue) }} zł</span>
                  <span class="sc-ltv" [class.sc-ltv--high]="ltvOf(c) > 80">LTV {{ ltvOf(c).toFixed(0) }} %</span>
                </div>
              </div>

              <!-- Okres -->
              <div class="sc-cell sc-cell--period">
                <div class="sc-period mono">{{ periodOf(c) }}</div>
                <div class="sc-period-sub muted">
                  <span class="sc-pill" [class.sc-pill--rowne]="c.installmentType === 'równe'"
                    [class.sc-pill--malejace]="c.installmentType === 'malejące'">
                    {{ c.installmentType === 'równe' ? 'rata równa' : 'rata malejąca' }}
                  </span>
                </div>
              </div>

              <!-- Stopa -->
              <div class="sc-cell sc-cell--rate">
                <div class="sc-rate mono">{{ fmtPct(c.rate, 2) }} %</div>
                <div class="sc-rate-sub muted">
                  @if (c.rateType === 'zmienna') {
                    WIBOR {{ fmtPct(c.wibor, 2) }} + marża {{ fmtPct(c.margin, 2) }}
                  } @else {
                    stała
                  }
                </div>
              </div>

              <!-- Pierwsza rata -->
              <div class="sc-cell sc-cell--rata">
                <div class="sc-rata mono"><b>{{ fmtPLN(c.firstInstallment, 2) }}</b><span class="sc-unit">zł</span></div>
                <div class="sc-rata-sub muted">pierwsza rata</div>
              </div>

              <!-- Odsetki -->
              <div class="sc-cell sc-cell--int">
                <div class="sc-int mono">{{ fmtPLN0(c.totalInterest) }}<span class="sc-unit">zł</span></div>
                <div class="sc-int-sub">
                  <span class="sc-int-dot"></span>
                  <span class="muted">suma odsetek</span>
                </div>
              </div>

              <!-- Chart -->
              <div class="sc-cell sc-cell--chart">
                <svg class="sc-spark" viewBox="0 0 96 28" aria-hidden="true">
                  <path [attr.d]="sparkFill(c.overpaymentsEnabled)" fill="var(--c-cap-soft)"/>
                  <path [attr.d]="sparkLine(c.overpaymentsEnabled)" fill="none" stroke="var(--c-cap)" stroke-width="1.4"/>
                  @if (c.overpaymentsEnabled) {
                    <circle [attr.cx]="sparkLastX(c.overpaymentsEnabled)" [attr.cy]="sparkLastY(c.overpaymentsEnabled)" r="2" fill="var(--c-over)"/>
                  }
                </svg>
                @if (c.overpaymentsEnabled) {
                  <div class="sc-chart-tag">nadpłaty</div>
                }
              </div>

              <!-- Data -->
              <div class="sc-cell sc-cell--date">
                <div class="sc-date" [title]="exactDateOf(c.updatedAt)">{{ relativeTimeOf(c.updatedAt) }}</div>
                <div class="sc-date-sub muted mono">{{ exactDateOf(c.updatedAt).slice(0, 10) }}</div>
              </div>

              <!-- Akcje -->
              <div class="sc-cell sc-cell--actions">
                <button class="sc-btn sc-btn--load" (click)="loadCalc(c)">
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M2 6 L10 6 M7 3 L10 6 L7 9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Wczytaj
                </button>
                <div class="sc-menu-wrap">
                  <button class="sc-btn sc-btn--ghost" [class.is-on]="openMenu() === c.id"
                    (click)="toggleMenu($event, c.id)" aria-label="Więcej akcji">
                    <svg width="14" height="14" viewBox="0 0 14 14">
                      <circle cx="3" cy="7" r="1.2" fill="currentColor"/>
                      <circle cx="7" cy="7" r="1.2" fill="currentColor"/>
                      <circle cx="11" cy="7" r="1.2" fill="currentColor"/>
                    </svg>
                  </button>
                  @if (openMenu() === c.id) {
                    <div class="sc-menu" role="menu" (click)="$event.stopPropagation()">
                      <button (click)="startRename(c)">
                        <svg width="13" height="13" viewBox="0 0 13 13"><path d="M2 11 L2 9 L9 2 L11 4 L4 11 Z" stroke="currentColor" stroke-width="1.1" fill="none" stroke-linejoin="round"/></svg>
                        Zmień nazwę
                      </button>
                      <button (click)="duplicate(c)">
                        <svg width="13" height="13" viewBox="0 0 13 13"><rect x="2" y="2" width="7" height="7" rx="1.2" stroke="currentColor" stroke-width="1.1" fill="none"/><rect x="4.5" y="4.5" width="7" height="7" rx="1.2" stroke="currentColor" stroke-width="1.1" fill="none"/></svg>
                        Duplikuj
                      </button>
                      <button>
                        <svg width="13" height="13" viewBox="0 0 13 13"><path d="M3 5 L6.5 1.5 L10 5 M6.5 1.5 L6.5 9 M2 11 L11 11" stroke="currentColor" stroke-width="1.1" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        Eksportuj CSV
                      </button>
                      <div class="sc-menu-sep"></div>
                      <button class="sc-menu-danger" (click)="startDelete(c)">
                        <svg width="13" height="13" viewBox="0 0 13 13"><path d="M3 4 L3 11 Q3 12 4 12 L9 12 Q10 12 10 11 L10 4 M2 4 L11 4 M5 4 L5 2 Q5 1.5 5.5 1.5 L7.5 1.5 Q8 1.5 8 2 L8 4 M5.5 6.5 L5.5 9.5 M7.5 6.5 L7.5 9.5" stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        Usuń
                      </button>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        }
      </div>

      <!-- FOOTER -->
      <div class="sc-footer">
        <div class="muted small">
          Wyświetlono <b class="mono">{{ filtered().length }}</b> z
          <b class="mono">{{ calc.savedCalculations().length }}</b> kalkulacji ·
          dane przechowywane lokalnie w przeglądarce
        </div>
        <button class="btn btn--ghost btn--mini">Eksportuj wszystkie do CSV</button>
      </div>

      <!-- RENAME -->
      @if (renameTarget(); as r) {
        <div class="sc-modal-mask" (click)="renameTarget.set(null)">
          <div class="sc-modal" (click)="$event.stopPropagation()">
            <div class="sc-modal-head">
              <div>
                <div class="sc-modal-tag">akcja</div>
                <h3>Zmień nazwę kalkulacji</h3>
              </div>
              <button class="sc-modal-close" (click)="renameTarget.set(null)" aria-label="Zamknij">×</button>
            </div>
            <div class="sc-modal-body">
              <label class="sc-modal-label">Nazwa</label>
              <div class="inp inp--focus">
                <input #renameInput type="text"
                  [ngModel]="renameVal()" (ngModelChange)="renameVal.set($event)"
                  (keydown.enter)="confirmRename()"
                  (keydown.escape)="renameTarget.set(null)"/>
              </div>
              <div class="sc-modal-hint">Nadaj kalkulacji nazwę, po której łatwo ją rozpoznasz — np. „Mieszkanie 65&nbsp;m² Wrocław".</div>
            </div>
            <div class="sc-modal-foot">
              <button class="btn btn--ghost" (click)="renameTarget.set(null)">Anuluj</button>
              <button class="btn btn--primary"
                [disabled]="!renameVal().trim() || renameVal().trim() === r.name"
                (click)="confirmRename()">Zapisz</button>
            </div>
          </div>
        </div>
      }

      <!-- DELETE -->
      @if (deleteTarget(); as d) {
        <div class="sc-modal-mask" (click)="deleteTarget.set(null)">
          <div class="sc-modal sc-modal--danger" (click)="$event.stopPropagation()">
            <div class="sc-modal-head">
              <div>
                <div class="sc-modal-tag sc-modal-tag--danger">usuwanie</div>
                <h3>Usunąć kalkulację?</h3>
              </div>
              <button class="sc-modal-close" (click)="deleteTarget.set(null)" aria-label="Zamknij">×</button>
            </div>
            <div class="sc-modal-body">
              <p class="sc-modal-text">
                Kalkulacja <b>„{{ d.name }}"</b> zostanie trwale usunięta. Tej operacji nie można cofnąć.
              </p>
              <div class="sc-modal-summary">
                <div><span class="muted">Kwota kredytu</span><b class="mono">{{ fmtPLN0(d.loanAmount) }} zł</b></div>
                <div><span class="muted">Okres</span><b class="mono">{{ d.years }} lat</b></div>
                <div><span class="muted">Oprocentowanie</span><b class="mono">{{ fmtPct(d.rate, 2) }} %</b></div>
                <div><span class="muted">Utworzono</span><b class="mono">{{ exactDateOf(d.createdAt).slice(0, 10) }}</b></div>
              </div>
            </div>
            <div class="sc-modal-foot">
              <button class="btn btn--ghost" (click)="deleteTarget.set(null)">Anuluj</button>
              <button class="btn btn--danger" (click)="confirmDelete()">
                <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true"><path d="M3 4 L3 11 Q3 12 4 12 L9 12 Q10 12 10 11 L10 4 M2 4 L11 4 M5 4 L5 2 Q5 1.5 5.5 1.5 L7.5 1.5 Q8 1.5 8 2 L8 4" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Usuń kalkulację
              </button>
            </div>
          </div>
        </div>
      }

      <!-- TOAST -->
      @if (toast(); as t) {
        <div class="sc-toast" role="status">
          <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5.5" stroke="var(--c-cap)" stroke-width="1.4" fill="none"/><path d="M4.5 7 L6.3 8.6 L9.5 5.3" stroke="var(--c-cap)" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>{{ t }}</span>
        </div>
      }
    </div>
  `,
})
export class SavedCalculationsComponent {
  calc = inject(CalcService);

  search = signal('');
  filter = signal<SavedCalcFilter>('all');
  sortBy = signal<SavedCalcSort>('updated');
  openMenu = signal<string | null>(null);

  renameTarget = signal<SavedCalculation | null>(null);
  renameVal = signal('');
  deleteTarget = signal<SavedCalculation | null>(null);
  toast = signal<string | null>(null);
  private toastTimeout: any = null;

  filters: { id: SavedCalcFilter; label: string }[] = [
    { id: 'all', label: 'Wszystkie' },
    { id: 'fav', label: 'Ulubione' },
    { id: 'work', label: 'Robocze' },
  ];

  /* ============== computed ============== */
  stats = computed(() => {
    const items = this.calc.savedCalculations();
    const lastUpdated = items.reduce((m, c) => c.updatedAt > m ? c.updatedAt : m, new Date(0));
    return {
      total: items.length,
      fav: items.filter(c => c.tag === 'ulubiona').length,
      work: items.filter(c => c.tag === 'robocza').length,
      lastUpdatedRelative: items.length ? relativeTime(lastUpdated) : '—',
    };
  });

  filtered = computed(() => {
    let out = this.calc.savedCalculations();
    const f = this.filter();
    if (f === 'fav') out = out.filter(c => c.tag === 'ulubiona');
    if (f === 'work') out = out.filter(c => c.tag === 'robocza');
    const q = this.search().trim().toLowerCase();
    if (q) out = out.filter(c => c.name.toLowerCase().includes(q) || (c.note && c.note.toLowerCase().includes(q)));
    const s = this.sortBy();
    const cmp: Record<SavedCalcSort, (a: SavedCalculation, b: SavedCalculation) => number> = {
      updated: (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
      created: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      name:    (a, b) => a.name.localeCompare(b.name, 'pl'),
      loan:    (a, b) => b.loanAmount - a.loanAmount,
      rata:    (a, b) => a.firstInstallment - b.firstInstallment,
    };
    return [...out].sort(cmp[s]);
  });

  filterCount(id: SavedCalcFilter): number {
    const items = this.calc.savedCalculations();
    if (id === 'all') return items.length;
    if (id === 'fav') return items.filter(c => c.tag === 'ulubiona').length;
    return items.filter(c => c.tag === 'robocza').length;
  }

  /* ============== helpers ============== */
  fmtPLN(v: number, dec = 2)  { return fmtPLN(v, dec); }
  fmtPLN0(v: number)          { return fmtPLN(v, 0); }
  fmtPct = fmtPct;
  ltvOf(c: SavedCalculation)  { return c.propertyValue ? (c.loanAmount / c.propertyValue) * 100 : 0; }
  periodOf(c: SavedCalculation) {
    return c.months ? `${c.years} l. ${c.months} m-cy` : `${c.years} lat`;
  }
  relativeTimeOf(d: Date) { return relativeTime(d); }
  exactDateOf(d: Date)    { return exactDate(d); }

  /* ============== sparkline ============== */
  private sparkCache = new Map<boolean, { line: string; fill: string; lastX: number; lastY: number }>();
  private buildSpark(overpay: boolean) {
    if (this.sparkCache.has(overpay)) return this.sparkCache.get(overpay)!;
    const n = 40;
    const pts: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const y = overpay
        ? Math.pow(1 - t, 1.6) * 0.95 + 0.04
        : (1 - Math.pow(t, 0.55)) * 0.95 + 0.04;
      pts.push([t * 92 + 2, 26 - y * 22]);
    }
    const line = pts.map((p, i) => (i === 0 ? `M${p[0]} ${p[1]}` : `L${p[0]} ${p[1]}`)).join(' ');
    const v = { line, fill: line + ` L94 28 L2 28 Z`, lastX: pts[n - 1][0], lastY: pts[n - 1][1] };
    this.sparkCache.set(overpay, v);
    return v;
  }
  sparkLine(overpay: boolean)  { return this.buildSpark(overpay).line; }
  sparkFill(overpay: boolean)  { return this.buildSpark(overpay).fill; }
  sparkLastX(overpay: boolean) { return this.buildSpark(overpay).lastX; }
  sparkLastY(overpay: boolean) { return this.buildSpark(overpay).lastY; }

  /* ============== akcje ============== */
  clearFilters() { this.search.set(''); this.filter.set('all'); }

  toggleMenu(ev: MouseEvent, id: string) {
    ev.stopPropagation();
    this.openMenu.set(this.openMenu() === id ? null : id);
  }

  @HostListener('document:mousedown', ['$event'])
  onDocClick(ev: MouseEvent) {
    const t = ev.target as HTMLElement | null;
    if (!t || !t.closest || !t.closest('.sc-menu-wrap')) this.openMenu.set(null);
  }
  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.renameTarget()) this.renameTarget.set(null);
    else if (this.deleteTarget()) this.deleteTarget.set(null);
    else this.openMenu.set(null);
  }

  loadCalc(c: SavedCalculation) {
    this.calc.loadSavedCalc(c);
    this.showToast(`Wczytano „${c.name}" do kalkulatora`);
  }

  startRename(c: SavedCalculation) {
    this.renameVal.set(c.name);
    this.renameTarget.set(c);
    this.openMenu.set(null);
  }
  confirmRename() {
    const target = this.renameTarget();
    const val = this.renameVal().trim();
    if (!target || !val || val === target.name) return;
    this.calc.renameSavedCalc(target.id, val);
    this.showToast(`Zmieniono nazwę na „${val}"`);
    this.renameTarget.set(null);
  }

  startDelete(c: SavedCalculation) {
    this.deleteTarget.set(c);
    this.openMenu.set(null);
  }
  confirmDelete() {
    const t = this.deleteTarget();
    if (!t) return;
    this.calc.deleteSavedCalc(t.id);
    this.showToast(`Usunięto kalkulację „${t.name}"`);
    this.deleteTarget.set(null);
  }

  duplicate(c: SavedCalculation) {
    const copy = this.calc.duplicateSavedCalc(c.id);
    this.openMenu.set(null);
    if (copy) this.showToast(`Utworzono kopię „${copy.name}"`);
  }

  private showToast(msg: string) {
    this.toast.set(msg);
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => this.toast.set(null), 3200);
  }
}
