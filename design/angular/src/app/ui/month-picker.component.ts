import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  HostListener,
  effect,
} from '@angular/core';
import { MonthLabelPipe } from '../pipes/month-label.pipe';

const MONTH_NAMES_SHORT = [
  'sty',
  'lut',
  'mar',
  'kwi',
  'maj',
  'cze',
  'lip',
  'sie',
  'wrz',
  'paź',
  'lis',
  'gru',
];
const MONTH_NAMES_LONG = [
  'styczeń',
  'luty',
  'marzec',
  'kwiecień',
  'maj',
  'czerwiec',
  'lipiec',
  'sierpień',
  'wrzesień',
  'październik',
  'listopad',
  'grudzień',
];

/**
 * MonthPicker — przycisk-trigger w stylu `.inp--date`, otwierający dialog
 * w którym użytkownik:
 *   1. szybko nawiguje po latach (◀/▶ co 10 lat + skrót „Dziś"),
 *   2. wybiera rok (siatka 5×2),
 *   3. wybiera miesiąc (siatka 4×3) — co od razu zatwierdza wybór.
 *
 * Można też potwierdzić jawnie przyciskiem „Zatwierdź" lub anulować.
 * Esc — zamyka bez zmian. Enter — zatwierdza staged.
 */
@Component({
  selector: 'app-month-picker',
  standalone: true,
  imports: [MonthLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="inp inp--date inp--trigger"
      [class.inp--disabled]="disabled()"
      [disabled]="disabled()"
      (click)="openDialog()"
    >
      <span class="mono inp-trigger-val">{{ value() | monthLabel }}</span>
      <svg width="14" height="14" viewBox="0 0 14 14" class="cal-ico">
        <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" fill="none" />
        <path d="M1.5 5.5 H12.5" stroke="currentColor" />
        <path d="M4 1 V3.5 M10 1 V3.5" stroke="currentColor" stroke-linecap="round" />
      </svg>
    </button>

    @if (open()) {
      <div class="sc-modal-mask mp-mask" (mousedown)="close()">
        <div
          class="mp-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Wybierz miesiąc"
          (mousedown)="$event.stopPropagation()"
        >
          <header class="mp-head">
            <div class="mp-head-text">
              <span class="sc-modal-tag">Wybór daty</span>
              <h3>Wybierz miesiąc</h3>
            </div>
            <button class="sc-modal-close" (click)="close()" aria-label="Zamknij">×</button>
          </header>

          <div class="mp-preview">
            <div class="mp-preview-col">
              <div class="mp-preview-lab">Wybierane</div>
              <div class="mp-preview-val">
                <span class="mp-preview-month">{{ stagedMonthName() }}</span>
                <span class="mp-preview-year mono">{{ stagedYear() }}</span>
              </div>
            </div>
            @if (stagedChanged()) {
              <div class="mp-preview-was">
                <span>było</span>
                <span class="mono">{{ value() | monthLabel }}</span>
              </div>
            }
          </div>

          <div class="mp-decade-nav">
            <button
              class="ico-btn mp-nav-btn"
              (click)="shiftDecade(-10)"
              aria-label="Cofnij o 10 lat"
            >
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path
                  d="M7.5 2 L3.5 6 L7.5 10"
                  stroke="currentColor"
                  stroke-width="1.5"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <div class="mp-decade-label">
              <span class="mp-decade-range mono">{{ decadeStart() }}–{{ decadeStart() + 9 }}</span>
              <span class="mp-decade-sub">Dekada</span>
            </div>
            <button
              class="ico-btn mp-nav-btn"
              (click)="shiftDecade(10)"
              aria-label="Naprzód o 10 lat"
            >
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path
                  d="M4.5 2 L8.5 6 L4.5 10"
                  stroke="currentColor"
                  stroke-width="1.5"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <button class="btn btn--mini mp-today" (click)="jumpToToday()">Dziś</button>
          </div>

          <div class="mp-years">
            @for (y of years(); track y) {
              <button
                class="mp-year"
                [class.is-focused]="y === stagedYear()"
                [class.is-selected]="y === value().getFullYear()"
                [class.is-today]="y === todayYear"
                (click)="stagedYear.set(y)"
              >
                <span class="mp-year-num mono">{{ y }}</span>
                @if (y === todayYear) {
                  <span class="mp-year-tag">dziś</span>
                }
              </button>
            }
          </div>

          <div class="mp-months">
            <div class="mp-months-head">
              <span class="mp-months-lab">Miesiące</span>
              <span class="mp-months-year mono">{{ stagedYear() }}</span>
            </div>
            <div class="mp-months-grid">
              @for (m of monthsShort; track $index) {
                <button
                  class="mp-month"
                  [class.is-focused]="$index === stagedMonth()"
                  [class.is-selected]="
                    $index === value().getMonth() && stagedYear() === value().getFullYear()
                  "
                  [class.is-today]="$index === todayMonth && stagedYear() === todayYear"
                  (click)="pickMonth($index)"
                >
                  {{ m }}
                </button>
              }
            </div>
          </div>

          <footer class="mp-foot">
            <button class="btn btn--ghost" (click)="close()">Anuluj</button>
            <button class="btn btn--primary" (click)="confirm()">Zatwierdź</button>
          </footer>
        </div>
      </div>
    }
  `,
})
export class MonthPickerComponent {
  value = input.required<Date>();
  valueChange = output<Date>();
  disabled = input<boolean>(false);

  monthsShort = MONTH_NAMES_SHORT;

  readonly todayYear = new Date().getFullYear();
  readonly todayMonth = new Date().getMonth();

  open = signal(false);
  stagedYear = signal(this.todayYear);
  stagedMonth = signal(this.todayMonth);
  decadeStart = signal(Math.floor(this.todayYear / 10) * 10);

  years = computed(() => {
    const start = this.decadeStart();
    return Array.from({ length: 10 }, (_, i) => start + i);
  });

  stagedMonthName = computed(() => MONTH_NAMES_LONG[this.stagedMonth()]);

  stagedChanged = computed(() => {
    const v = this.value();
    return this.stagedYear() !== v.getFullYear() || this.stagedMonth() !== v.getMonth();
  });

  /** Synchronizuj staged → bieżącą wartość przy otwarciu / zmianie wejścia. */
  private readonly _syncOnOpen = effect(() => {
    if (!this.open()) return;
    const v = this.value();
    this.stagedYear.set(v.getFullYear());
    this.stagedMonth.set(v.getMonth());
    this.decadeStart.set(Math.floor(v.getFullYear() / 10) * 10);
  });

  openDialog() {
    if (this.disabled()) return;
    this.open.set(true);
  }

  close() {
    this.open.set(false);
  }

  shiftDecade(delta: number) {
    this.decadeStart.update((d) => d + delta);
  }

  jumpToToday() {
    this.decadeStart.set(Math.floor(this.todayYear / 10) * 10);
    this.stagedYear.set(this.todayYear);
    this.stagedMonth.set(this.todayMonth);
  }

  pickMonth(m: number) {
    this.stagedMonth.set(m);
    this.confirm();
  }

  confirm() {
    this.valueChange.emit(new Date(this.stagedYear(), this.stagedMonth(), 1));
    this.close();
  }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (!this.open()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      this.confirm();
    }
  }
}
