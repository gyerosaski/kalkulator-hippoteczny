import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CalcService } from '../calc.service';
import { MonthLabelPipe } from '../pipes/month-label.pipe';

interface ChartGeo {
  balancePath: string;
  balanceArea: string;
  interestPath: string;
  principalPath: string;
  balLabels: { y: number; v: number }[];
  yearTicks: { x: number; year: number }[];
}

@Component({
  selector: 'app-trend-chart',
  standalone: true,
  imports: [MonthLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="card-head">
        <div>
          <h3>Harmonogram spłaty kredytu</h3>
          <div class="muted small">
            {{ calc.startDate() | monthLabel }} → {{ endDate() | monthLabel }}
          </div>
        </div>
        <div class="legend-inline">
          <span><i class="dot" style="background:var(--accent-sage-deep)"></i>saldo</span>
          <span><i class="dot" style="background:var(--accent-peach-deep)"></i>odsetki</span>
          <span><i class="dot" style="background:var(--accent-lav-deep)"></i>kapitał</span>
        </div>
      </div>
      @if (geo(); as g) {
        <svg viewBox="0 0 720 240" class="trend-chart" preserveAspectRatio="none">
          <defs>
            <linearGradient id="balGradA" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="var(--accent-sage)" stop-opacity="0.35" />
              <stop offset="100%" stop-color="var(--accent-sage)" stop-opacity="0.02" />
            </linearGradient>
          </defs>
          @for (l of g.balLabels; track l.y) {
            <line
              [attr.x1]="56"
              [attr.x2]="704"
              [attr.y1]="l.y"
              [attr.y2]="l.y"
              stroke="var(--grid)"
              stroke-dasharray="2 4"
            />
            <text [attr.x]="48" [attr.y]="l.y + 3" class="ax-label" text-anchor="end">
              {{ (l.v / 1000).toFixed(0) }}k
            </text>
          }
          <path [attr.d]="g.balanceArea" fill="url(#balGradA)" />
          <path
            [attr.d]="g.balancePath"
            fill="none"
            stroke="var(--accent-sage-deep)"
            stroke-width="2"
          />
          <path
            [attr.d]="g.interestPath"
            fill="none"
            stroke="var(--accent-peach-deep)"
            stroke-width="1.5"
            opacity="0.85"
          />
          <path
            [attr.d]="g.principalPath"
            fill="none"
            stroke="var(--accent-lav-deep)"
            stroke-width="1.5"
            opacity="0.85"
          />
          @for (t of g.yearTicks; track t.year) {
            <text [attr.x]="t.x" [attr.y]="232" text-anchor="middle" class="ax-label">
              {{ t.year }}
            </text>
          }
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
    return rows.length ? rows[rows.length - 1].date : null;
  });

  geo = computed<ChartGeo | null>(() => {
    const rows = this.calc.schedule().rows;
    if (!rows.length) return null;
    const w = 720,
      h = 240,
      padL = 56,
      padR = 16,
      padT = 16,
      padB = 28;
    const innerW = w - padL - padR,
      innerH = h - padT - padB;
    const n = rows.length;
    const maxBalance = Math.max(...rows.map((r) => r.balance));
    const stackMax = Math.max(...rows.map((r) => r.rata + r.monthlyCost));
    const x = (i: number) => padL + (i / (n - 1)) * innerW;
    const yBal = (v: number) => padT + innerH - (v / maxBalance) * innerH;
    const yR = (v: number) => padT + innerH - (v / stackMax) * innerH * 0.55;

    const balancePath = rows
      .map((r, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${yBal(r.balance).toFixed(1)}`)
      .join(' ');
    const balanceArea =
      balancePath + ` L ${x(n - 1).toFixed(1)} ${padT + innerH} L ${padL} ${padT + innerH} Z`;
    const interestPath = rows
      .map((r, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${yR(r.interest).toFixed(1)}`)
      .join(' ');
    const principalPath = rows
      .map((r, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${yR(r.principal).toFixed(1)}`)
      .join(' ');

    const balTicks = 4;
    const balLabels = Array.from({ length: balTicks + 1 }, (_, i) => ({
      y: padT + (i / balTicks) * innerH,
      v: maxBalance * (1 - i / balTicks),
    }));

    const allTicks: { x: number; year: number }[] = [];
    rows.forEach((r, i) => {
      if (r.date.getMonth() === 0 || i === 0 || i === n - 1) {
        allTicks.push({ x: x(i), year: r.date.getFullYear() });
      }
    });
    const step = Math.ceil(allTicks.length / 8);
    const yearTicks = allTicks.filter((_, idx) => idx % step === 0);

    return { balancePath, balanceArea, interestPath, principalPath, balLabels, yearTicks };
  });
}
