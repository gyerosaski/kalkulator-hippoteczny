import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CalcService } from '../calc.service';
import { ScheduleRow, RateBand, RateChange } from '../models';

interface RateChartGeo {
  w: number;
  h: number;
  padL: number;
  padR: number;
  padT: number;
  padB: number;
  innerW: number;
  innerH: number;
  /** Y-axis ticks */
  yTicks: { value: number; y: number; label: string }[];
  /** X-axis year ticks */
  xTicks: { year: number; x: number }[];
  /** Główny path step-after */
  linePath: string;
  /** Area pod linią */
  areaPath: string;
  /** Pasma (tory) z wyliczonym X/Y/szerokością */
  bands: {
    kind: RateBand['kind'];
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    color: string;
    opacity: number;
    showLabel: boolean;
    labelX: number;
    labelY: number;
  }[];
  /** Punkty zmian z X/Y i etykietą + anti-collision offset */
  changes: { cx: number; cy: number; label: string; tickEnd: number; labelOffset: number }[];
}

const BAND_COLOR: Record<RateBand['kind'], string> = {
  bridge: 'var(--c-int-mid)',
  lowDown: 'var(--c-cost-mid)',
  promo: 'var(--c-cap-mid)',
  period: 'var(--accent)',
};
const BAND_ORDER: RateBand['kind'][] = ['period', 'bridge', 'lowDown', 'promo'];

const pctFmt = (v: number) =>
  new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

@Component({
  selector: 'app-rate-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (geo(); as g) {
      <div class="card card--rate">
        <div class="trend-head rate-head">
          <h3 class="trend-title">Zmiana oprocentowania w czasie</h3>
          <ul class="trend-legend rate-legend">
            <li>
              <span class="line-glyph">
                <svg width="28" height="10">
                  <path
                    d="M2 7 H10 V3 H18 V7 H26"
                    stroke="var(--ink)"
                    stroke-width="2"
                    fill="none"
                  />
                  <circle cx="10" cy="3" r="2.5" fill="var(--ink)" />
                  <circle cx="18" cy="3" r="2.5" fill="var(--ink)" />
                </svg>
              </span>
              Efektywne oprocentowanie
            </li>
            @if (hasKind('period')) {
              <li>
                <span class="dot" style="background:var(--accent); opacity:0.5"></span>okres
                oprocentowania
              </li>
            }
            @if (hasKind('bridge')) {
              <li><span class="dot" style="background:var(--c-int-mid)"></span>ubezp. pomostowe</li>
            }
            @if (hasKind('lowDown')) {
              <li><span class="dot" style="background:var(--c-cost-mid)"></span>niski wkład</li>
            }
            @if (hasKind('promo')) {
              <li><span class="dot" style="background:var(--c-cap-mid)"></span>promocja</li>
            }
          </ul>
        </div>

        <svg
          [attr.viewBox]="'0 0 ' + g.w + ' ' + g.h"
          class="rate-chart"
          preserveAspectRatio="none"
        >
          <!-- gridlines + lewa oś -->
          @for (t of g.yTicks; track t.value) {
            <line
              [attr.x1]="g.padL"
              [attr.x2]="g.w - g.padR"
              [attr.y1]="t.y"
              [attr.y2]="t.y"
              stroke="var(--grid)"
              stroke-dasharray="2 4"
            />
            <text [attr.x]="g.padL - 10" [attr.y]="t.y + 3" class="ax-label" text-anchor="end">
              {{ t.label }}
            </text>
          }
          <text
            [attr.x]="g.padL - 70"
            [attr.y]="g.padT + g.innerH / 2"
            [attr.transform]="'rotate(-90 ' + (g.padL - 70) + ' ' + (g.padT + g.innerH / 2) + ')'"
            class="ax-title"
            text-anchor="middle"
          >
            Nominalne oprocentowanie roczne
          </text>

          <!-- pasma (tory) -->
          @for (b of g.bands; track $index) {
            <g>
              <rect
                [attr.x]="b.x"
                [attr.y]="b.y"
                [attr.width]="b.width"
                [attr.height]="b.height"
                [attr.fill]="b.color"
                [attr.opacity]="b.opacity"
              />
              @if (b.showLabel) {
                <text
                  [attr.x]="b.labelX"
                  [attr.y]="b.labelY"
                  class="rate-band-label"
                  fill="var(--ink-2)"
                >
                  {{ b.label }}
                </text>
              }
            </g>
          }

          <!-- area pod linią -->
          <path [attr.d]="g.areaPath" fill="var(--c-int)" opacity="0.10" />

          <!-- step-line -->
          <path
            [attr.d]="g.linePath"
            fill="none"
            stroke="var(--ink)"
            stroke-width="2"
            stroke-linejoin="miter"
            stroke-linecap="butt"
          />

          <!-- punkty zmian -->
          @for (c of g.changes; track $index) {
            <g>
              <circle
                [attr.cx]="c.cx"
                [attr.cy]="c.cy"
                r="4"
                fill="var(--ink)"
                stroke="var(--surface)"
                stroke-width="1.5"
              />
              <line
                [attr.x1]="c.cx"
                [attr.x2]="c.cx"
                [attr.y1]="c.cy - 6"
                [attr.y2]="c.cy - c.tickEnd"
                stroke="var(--line-2)"
              />
              <text
                [attr.x]="c.cx"
                [attr.y]="c.cy - c.labelOffset"
                class="rate-change-label"
                text-anchor="middle"
              >
                {{ c.label }}
              </text>
            </g>
          }

          <!-- ticki X (lata) -->
          @for (t of g.xTicks; track t.year) {
            <text
              [attr.x]="t.x"
              [attr.y]="g.padT + g.innerH + 10"
              [attr.transform]="'rotate(-90 ' + t.x + ' ' + (g.padT + g.innerH + 10) + ')'"
              class="ax-label"
              text-anchor="end"
            >
              {{ t.year }}
            </text>
          }

          <!-- baseline -->
          <line
            [attr.x1]="g.padL"
            [attr.x2]="g.w - g.padR"
            [attr.y1]="g.padT + g.innerH"
            [attr.y2]="g.padT + g.innerH"
            stroke="var(--line-2)"
          />
        </svg>
      </div>
    }
  `,
})
export class RateChartComponent {
  calc = inject(CalcService);

  hasKind(k: RateBand['kind']): boolean {
    return this.calc.schedule().rateBands.some((b) => b.kind === k);
  }

  geo = computed<RateChartGeo | null>(() => {
    const sched = this.calc.schedule();
    const rows: ScheduleRow[] = sched.rows;
    const rateBands: RateBand[] = sched.rateBands;
    const rateChanges: RateChange[] = sched.rateChanges;
    if (!rows.length || !sched.hasRateChange) return null;

    const w = 1100,
      h = 240;
    const padL = 92,
      padR = 92,
      padT = 28,
      padB = 56;
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;
    const n = rows.length;

    const xAt = (m: number) => padL + ((m - 0.5) / n) * innerW;
    const xEdge = (m: number) => padL + ((m - 1) / n) * innerW;
    const xAfter = (m: number) => padL + (m / n) * innerW;

    const rateVals = rows.map((r) => r.rate);
    const rMax = Math.max(...rateVals);
    const span = rMax - 0;
    const step = span > 8 ? 2 : span > 4 ? 1 : span > 2 ? 0.5 : 0.25;
    const yMax = Math.ceil((rMax * 1.08) / step) * step;
    const yMin = 0;
    const yAt = (v: number) => padT + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

    const yTicks: RateChartGeo['yTicks'] = [];
    for (let v = yMin; v <= yMax + 1e-6; v += step) {
      yTicks.push({ value: v, y: yAt(v), label: `${pctFmt(v)}%` });
    }

    const xTicks: RateChartGeo['xTicks'] = [];
    let lastYear: number | null = null;
    rows.forEach((r) => {
      const y = r.date.getFullYear();
      if (y !== lastYear) {
        xTicks.push({ year: y, x: xAt(r.idx) });
        lastYear = y;
      }
    });

    // step-after path
    let linePath = '';
    rows.forEach((r, i) => {
      const x1 = xEdge(r.idx);
      const x2 = xAfter(r.idx);
      const y = yAt(r.rate);
      if (i === 0) linePath += `M ${x1.toFixed(1)} ${y.toFixed(1)} `;
      else linePath += `L ${x1.toFixed(1)} ${y.toFixed(1)} `;
      linePath += `L ${x2.toFixed(1)} ${y.toFixed(1)} `;
    });
    const areaPath =
      linePath +
      `L ${(padL + innerW).toFixed(1)} ${(padT + innerH).toFixed(1)} ` +
      `L ${padL.toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;

    // pasma — tylko aktywne typy w określonej kolejności
    const usedKinds: RateBand['kind'][] = [];
    BAND_ORDER.forEach((k) => {
      if (rateBands.some((b) => b.kind === k)) usedKinds.push(k);
    });
    const trackH = 12;
    const trackGap = 3;
    const tracksTop = 4;
    const trackY = (k: RateBand['kind']) => tracksTop + usedKinds.indexOf(k) * (trackH + trackGap);

    const bands = rateBands.map((b) => {
      const x1 = xEdge(b.fromMonth);
      const x2 = xAfter(b.toMonth);
      const yT = trackY(b.kind);
      const width = Math.max(2, x2 - x1);
      return {
        kind: b.kind,
        x: x1,
        y: yT,
        width,
        height: trackH,
        color: BAND_COLOR[b.kind],
        opacity: b.kind === 'period' ? 0.18 : 0.32,
        label: b.label,
        showLabel: width > 70,
        labelX: x1 + 6,
        labelY: yT + 9,
      };
    });

    const changes = rateChanges.map((c, i) => {
      const cx = xEdge(c.fromMonth);
      const cy = yAt(c.rate);
      const prevCx = i > 0 ? xEdge(rateChanges[i - 1].fromMonth) : -9999;
      const close = cx - prevCx < 60;
      return {
        cx,
        cy,
        label: `${pctFmt(c.rate)}%`,
        tickEnd: close ? 34 : 18,
        labelOffset: close ? 38 : 22,
      };
    });

    return {
      w,
      h,
      padL,
      padR,
      padT,
      padB,
      innerW,
      innerH,
      yTicks,
      xTicks,
      linePath,
      areaPath,
      bands,
      changes,
    };
  });
}
