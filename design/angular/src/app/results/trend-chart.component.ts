import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CalcService } from '../calc.service';
import { MonthLabelPipe } from '../pipes/month-label.pipe';
import { YearAggregate } from '../models';

interface BarSegment {
  key: 'interest' | 'monthlyCost' | 'principal' | 'overpayment';
  label: string;
  color: string;
}

interface BarSegmentRect {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface BarColumn {
  year: number;
  centerX: number;
  segments: BarSegmentRect[];
}

interface LinePoint {
  x: number;
  y: number;
  value: number;
  year: number | null;
}

interface AxisTick {
  value: number;
  y: number;
  label: string;
}

interface XTick {
  year: number;
  x: number;
}

interface ChartGeo {
  /** geometria SVG */
  w: number; h: number;
  padL: number; padR: number; padT: number; padB: number;
  innerW: number; innerH: number;
  /** seria – słupki, linia, etykiety */
  bars: BarColumn[];
  linePath: string;
  linePts: LinePoint[];
  /** ticki osi */
  balTicks: AxisTick[];      // lewa: saldo
  stackTicks: AxisTick[];    // prawa: suma rocznych płatności
  xTicks: XTick[];           // lata
}

const SEGMENTS: BarSegment[] = [
  { key: 'interest',    label: 'Odsetki',               color: 'var(--c-int)'  },
  { key: 'monthlyCost', label: 'Koszty okołokredytowe', color: 'var(--c-cost)' },
  { key: 'principal',   label: 'Kapitał',               color: 'var(--c-cap)'  },
  { key: 'overpayment', label: 'Nadpłaty',              color: 'var(--c-over)' },
];

function niceCeil(v: number, step: number): number {
  if (v <= 0) return step;
  return Math.ceil(v / step) * step;
}

function fmtAxisPLN(v: number): string {
  return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(v) + ' zł';
}

@Component({
  selector: 'app-trend-chart',
  standalone: true,
  imports: [MonthLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card card--trend">
      <div class="trend-head">
        <h3 class="trend-title">
          Harmonogram spłaty kredytu: {{ calc.startDate() | monthLabel }} - {{ endDate() | monthLabel }}
        </h3>
        <ul class="trend-legend">
          <li><span class="dot" style="background:var(--c-int)"></span>Odsetki</li>
          <li><span class="dot" style="background:var(--c-cost)"></span>Koszty okołokredytowe</li>
          <li><span class="dot" style="background:var(--c-cap)"></span>Kapitał</li>
          <li><span class="dot" style="background:var(--c-over)"></span>Nadpłaty</li>
          <li>
            <span class="line-glyph">
              <svg width="28" height="10">
                <line x1="2" y1="5" x2="26" y2="5" stroke="var(--ink)" stroke-width="2"/>
                <circle cx="9" cy="5" r="2.5" fill="var(--ink)"/>
                <circle cx="19" cy="5" r="2.5" fill="var(--ink)"/>
              </svg>
            </span>
            Pozostało do spłaty
          </li>
        </ul>
      </div>

      @if (geo(); as g) {
        <svg [attr.viewBox]="'0 0 ' + g.w + ' ' + g.h" class="trend-chart trend-chart--combo" preserveAspectRatio="none">
          <!-- gridlines + etykiety lewej osi (saldo) -->
          @for (t of g.balTicks; track t.value) {
            <line [attr.x1]="g.padL" [attr.x2]="g.w - g.padR"
                  [attr.y1]="t.y" [attr.y2]="t.y"
                  stroke="var(--grid)" stroke-dasharray="2 4"/>
            <text [attr.x]="g.padL - 10" [attr.y]="t.y + 3"
                  class="ax-label" text-anchor="end">{{ t.label }}</text>
          }

          <!-- etykiety prawej osi (suma rocznych płatności) -->
          @for (t of g.stackTicks; track t.value) {
            <text [attr.x]="g.w - g.padR + 10" [attr.y]="t.y + 3"
                  class="ax-label" text-anchor="start">{{ t.label }}</text>
          }

          <!-- tytuły osi -->
          <text [attr.x]="g.padL - 70" [attr.y]="g.padT + g.innerH / 2"
                [attr.transform]="'rotate(-90 ' + (g.padL - 70) + ' ' + (g.padT + g.innerH / 2) + ')'"
                class="ax-title" text-anchor="middle">Kwota pozostała do spłaty</text>
          <text [attr.x]="g.w - g.padR + 70" [attr.y]="g.padT + g.innerH / 2"
                [attr.transform]="'rotate(-90 ' + (g.w - g.padR + 70) + ' ' + (g.padT + g.innerH / 2) + ')'"
                class="ax-title" text-anchor="middle">Suma płatności w danym roku</text>

          <!-- słupki -->
          @for (b of g.bars; track b.year) {
            <g class="bar-group">
              @for (s of b.segments; track $index) {
                <rect [attr.x]="s.x" [attr.y]="s.y"
                      [attr.width]="s.width" [attr.height]="s.height"
                      [attr.fill]="s.color"/>
              }
            </g>
          }

          <!-- linia salda + punkty -->
          <path [attr.d]="g.linePath" fill="none"
                stroke="var(--ink)" stroke-width="2"
                stroke-linejoin="round" stroke-linecap="round"/>
          @for (p of g.linePts; track $index) {
            <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4"
                    fill="var(--ink)" stroke="var(--surface)" stroke-width="1.5"/>
          }

          <!-- etykiety osi X (lata, obrócone) -->
          @for (t of g.xTicks; track t.year) {
            <text [attr.x]="t.x" [attr.y]="g.padT + g.innerH + 10"
                  [attr.transform]="'rotate(-90 ' + t.x + ' ' + (g.padT + g.innerH + 10) + ')'"
                  class="ax-label" text-anchor="end">{{ t.year }}</text>
          }

          <!-- baseline -->
          <line [attr.x1]="g.padL" [attr.x2]="g.w - g.padR"
                [attr.y1]="g.padT + g.innerH" [attr.y2]="g.padT + g.innerH"
                stroke="var(--line-2)"/>
        </svg>
      } @else {
        <div class="chart-empty">Brak danych</div>
      }
    </div>
  `,
})
export class TrendChartComponent {
  calc = inject(CalcService);

  endDate = computed(() => {
    const rows = this.calc.schedule().rows;
    return rows.length ? rows[rows.length - 1].date : new Date();
  });

  geo = computed<ChartGeo | null>(() => {
    const sched = this.calc.schedule();
    const years: YearAggregate[] = sched.yearly;
    const rows = sched.rows;
    if (!years.length || !rows.length) return null;

    // ===== geometria =====
    const w = 1100, h = 360;
    const padL = 92, padR = 92, padT = 24, padB = 56;
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;
    const n = years.length;

    const groupW = innerW / n;
    const barW = Math.max(8, groupW * 0.78);
    const xCenter = (i: number) => padL + groupW * (i + 0.5);

    // ===== skale =====
    const stackTotals = years.map(y => y.interest + y.monthlyCost + y.principal + y.overpayment);
    const maxStack = Math.max(...stackTotals);
    const startBalance = (rows[0].balance ?? 0) + (rows[0].principal ?? 0) + (rows[0].overpayment ?? 0);
    const maxBalance = Math.max(startBalance, ...years.map(y => y.balance));

    const yMaxStack = niceCeil(maxStack, 5000);
    const yMaxBalance = niceCeil(maxBalance, 50000);

    const yStack = (v: number) => padT + innerH - (v / yMaxStack) * innerH;
    const yBal   = (v: number) => padT + innerH - (v / yMaxBalance) * innerH;

    // ===== ticki =====
    const balTicks: AxisTick[] = [];
    for (let v = 0; v <= yMaxBalance + 0.5; v += 50000) {
      balTicks.push({ value: v, y: yBal(v), label: fmtAxisPLN(v) });
    }
    const stackTicks: AxisTick[] = [];
    for (let v = 0; v <= yMaxStack + 0.5; v += 5000) {
      stackTicks.push({ value: v, y: yStack(v), label: fmtAxisPLN(v) });
    }

    // ===== słupki =====
    const bars: BarColumn[] = years.map((yr, i) => {
      const cx = xCenter(i);
      const segments: BarSegmentRect[] = [];
      let cursor = 0;
      for (const seg of SEGMENTS) {
        const v = (yr as unknown as Record<string, number>)[seg.key] || 0;
        if (v <= 0) continue;
        const y1 = yStack(cursor);
        const y2 = yStack(cursor + v);
        cursor += v;
        segments.push({
          x: cx - barW / 2, y: y2,
          width: barW, height: Math.max(0, y1 - y2),
          color: seg.color,
        });
      }
      return { year: yr.year, centerX: cx, segments };
    });

    // ===== linia salda =====
    const linePts: LinePoint[] = [
      { x: padL, y: yBal(startBalance), value: startBalance, year: null },
      ...years.map((yr, i) => ({
        x: xCenter(i), y: yBal(yr.balance), value: yr.balance, year: yr.year,
      })),
    ];
    const linePath = linePts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');

    // ===== etykiety X =====
    const xTicks: XTick[] = years.map((yr, i) => ({ year: yr.year, x: xCenter(i) }));

    return {
      w, h, padL, padR, padT, padB, innerW, innerH,
      bars, linePath, linePts, balTicks, stackTicks, xTicks,
    };
  });
}
