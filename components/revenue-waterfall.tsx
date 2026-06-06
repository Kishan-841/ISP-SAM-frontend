'use client';

import { formatRupeesCompact } from '../lib/format-rupees';

/**
 * Compact waterfall — hand-rolled SVG so we control density and label
 * visibility precisely (Recharts couldn't show a ₹1L delta on a ₹35L scale
 * and required custom shapes for value labels). Sized to feel like a
 * dashboard widget, not a marketing slide: thin bars, muted palette, no
 * decorative chrome.
 *
 * Story it tells, left → right:
 *   Apr 1 baseline → +Upgrades → −Downgrades → −Disconnections → Today
 */

const COLOR = {
  start:   { fill: '#64748b', stroke: '#475569' },  // slate
  ups:     { fill: '#059669', stroke: '#047857' },  // emerald
  downs:   { fill: '#d97706', stroke: '#b45309' },  // amber
  term:    { fill: '#dc2626', stroke: '#b91c1c' },  // red
  end:     { fill: '#0f766e', stroke: '#115e59' },  // teal
};

// Chart geometry. The SVG renders inside a viewBox and scales to the card
// width, so these numbers are *logical* not pixels. Keep the intrinsic width
// (PADDING_LEFT + COLUMN_W * 5) close to the actual rendered width on screen
// — otherwise the browser scales the SVG up and all text/bar widths inflate
// with it, breaking the dashboard density.
const CHART_H = 180;
const PADDING_TOP = 28;
const PADDING_BOTTOM = 44;
const PADDING_LEFT = 40;
const COLUMN_W = 180;
const BAR_W = 30;
const MIN_VISIBLE_H = 5;   // smallest non-zero bar height in pixels

export type WaterfallInput = {
  startArcRupees: number;
  upgradesArcRupees: number;
  downgradesArcRupees: number;
  terminationsArcRupees: number;
  endArcRupees: number;
};

type Step = {
  key: string;
  name: string;
  count?: number;
  delta: number;
  range: [number, number];
  color: typeof COLOR[keyof typeof COLOR];
  kind: 'pillar' | 'positive' | 'negative' | 'neutral';
};

export function RevenueWaterfall({
  input,
  counts,
  startLabel = 'Apr 1',
  endLabel = 'Today',
  heading = 'ARC Movement',
}: {
  input: WaterfallInput;
  counts?: { upgrades?: number; downgrades?: number; terminations?: number };
  /** X-axis label for the start pillar. Default "Apr 1" suits existing-base. */
  startLabel?: string;
  /** X-axis label for the end pillar. Default "Today". */
  endLabel?: string;
  /** Section heading shown in the chart's header strip. */
  heading?: string;
}) {
  const start = input.startArcRupees;
  const ups = input.upgradesArcRupees;
  const downs = input.downgradesArcRupees;
  const term = input.terminationsArcRupees;
  const end = input.endArcRupees;

  const afterUps = start + ups;
  const afterDowns = afterUps - downs;
  const afterTerm = afterDowns - term;

  const steps: Step[] = [
    {
      key: 'start',
      name: startLabel,
      delta: start,
      range: [0, start],
      color: COLOR.start,
      kind: 'pillar',
    },
    {
      key: 'ups',
      name: 'Upgrades',
      count: counts?.upgrades,
      delta: ups,
      range: [start, afterUps],
      color: COLOR.ups,
      kind: ups > 0 ? 'positive' : 'neutral',
    },
    {
      key: 'downs',
      name: 'Downgrades',
      count: counts?.downgrades,
      delta: -downs,
      range: [afterDowns, afterUps],
      color: COLOR.downs,
      kind: downs > 0 ? 'negative' : 'neutral',
    },
    {
      key: 'term',
      name: 'Disconnections',
      count: counts?.terminations,
      delta: -term,
      range: [afterTerm, afterDowns],
      color: COLOR.term,
      kind: term > 0 ? 'negative' : 'neutral',
    },
    {
      key: 'end',
      name: endLabel,
      delta: end,
      range: [0, end],
      color: COLOR.end,
      kind: 'pillar',
    },
  ];

  const maxY = Math.max(start, afterUps, afterDowns, afterTerm, end);
  const yMax = niceCeiling(maxY * 1.05);

  const totalW = PADDING_LEFT + COLUMN_W * steps.length;
  const totalH = CHART_H + PADDING_TOP + PADDING_BOTTOM;

  function y(rupees: number) {
    if (yMax === 0) return CHART_H + PADDING_TOP;
    return PADDING_TOP + CHART_H * (1 - rupees / yMax);
  }

  type Geom = {
    cx: number;
    barX: number;
    barY: number;
    barH: number;
  };
  const geom: Geom[] = steps.map((s, i) => {
    const cx = PADDING_LEFT + i * COLUMN_W + COLUMN_W / 2;
    const barX = cx - BAR_W / 2;
    const [lo, hi] = s.range;
    const top = y(hi);
    const bottom = y(lo);
    let barH = bottom - top;
    if (s.kind !== 'pillar' && s.delta !== 0 && barH < MIN_VISIBLE_H) {
      barH = MIN_VISIBLE_H;
    }
    const barY = s.kind === 'pillar' ? top : Math.min(top, bottom - barH);
    return { cx, barX, barY, barH };
  });

  const ticks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];
  const netDelta = end - start;
  const netClass =
    netDelta > 0 ? 'text-emerald-600' : netDelta < 0 ? 'text-red-600' : 'text-gray-500';
  const netSign = netDelta > 0 ? '+' : netDelta < 0 ? '−' : '';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Single-line summary header — terse, data-first */}
      <div className="flex items-baseline justify-between gap-2 mb-2.5">
        <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
          {heading}
        </h3>
        <div className="text-[11px] text-gray-600 tabular-nums">
          <span className="text-gray-500">{formatRupeesCompact(start)}</span>
          <span className="mx-1 text-gray-300">→</span>
          <span className="font-semibold text-gray-900">{formatRupeesCompact(end)}</span>
          <span className={`ml-1.5 font-semibold ${netClass}`}>
            {netSign}{formatRupeesCompact(Math.abs(netDelta))}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto -mx-1">
        <svg
          viewBox={`0 0 ${totalW} ${totalH}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-auto min-w-[560px]"
          role="img"
          aria-label="ARC movement waterfall"
        >
          {/* Y-axis gridlines + tick labels */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PADDING_LEFT}
                x2={totalW}
                y1={y(t)}
                y2={y(t)}
                stroke="#f1f5f9"
                strokeWidth={1}
              />
              <text
                x={PADDING_LEFT - 6}
                y={y(t) + 3}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="8"
                fontFamily="ui-sans-serif, system-ui"
              >
                {formatYTick(t)}
              </text>
            </g>
          ))}

          {/* Step connectors */}
          {steps.map((s, i) => {
            if (i === 0) return null;
            const prev = geom[i - 1]!;
            const cur = geom[i]!;
            const fromY = i === steps.length - 1 ? y(end) : (s.delta >= 0 ? y(s.range[0]) : y(s.range[1]));
            return (
              <line
                key={`conn-${s.key}`}
                x1={prev.cx + BAR_W / 2}
                x2={cur.barX}
                y1={fromY}
                y2={fromY}
                stroke="#cbd5e1"
                strokeDasharray="2 2"
                strokeWidth={1}
              />
            );
          })}

          {/* Bars */}
          {steps.map((s, i) => {
            const g = geom[i]!;
            const isZero = s.kind !== 'pillar' && s.delta === 0;
            return (
              <g key={s.key}>
                {isZero ? (
                  <circle
                    cx={g.cx}
                    cy={y(s.range[0])}
                    r={3}
                    fill="white"
                    stroke="#94a3b8"
                    strokeWidth={1.25}
                  />
                ) : (
                  <rect
                    x={g.barX}
                    y={g.barY}
                    width={BAR_W}
                    height={g.barH}
                    rx={2}
                    fill={s.color.fill}
                    stroke={s.color.stroke}
                    strokeWidth={0.5}
                  />
                )}

                <ValueLabel
                  cx={g.cx}
                  y={isZero ? y(s.range[0]) - 8 : g.barY - 5}
                  kind={s.kind}
                  delta={s.delta}
                />

                <text
                  x={g.cx}
                  y={PADDING_TOP + CHART_H + 13}
                  textAnchor="middle"
                  fill="#475569"
                  fontSize="9"
                  fontFamily="ui-sans-serif, system-ui"
                  fontWeight={s.kind === 'pillar' ? 600 : 500}
                >
                  {s.name}
                </text>
                {s.count !== undefined && (
                  <text
                    x={g.cx}
                    y={PADDING_TOP + CHART_H + 24}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="8"
                    fontFamily="ui-sans-serif, system-ui"
                  >
                    {s.count}
                  </text>
                )}
              </g>
            );
          })}

          {/* X-axis baseline */}
          <line
            x1={PADDING_LEFT}
            x2={totalW}
            y1={PADDING_TOP + CHART_H}
            y2={PADDING_TOP + CHART_H}
            stroke="#e2e8f0"
            strokeWidth={1}
          />
        </svg>
      </div>
    </div>
  );
}

// ─── Bits ─────────────────────────────────────────────────────────────

function ValueLabel({
  cx,
  y,
  kind,
  delta,
}: {
  cx: number;
  y: number;
  kind: Step['kind'];
  delta: number;
}) {
  if (kind === 'pillar') {
    return (
      <text
        x={cx}
        y={y}
        textAnchor="middle"
        fontSize="10"
        fontWeight={600}
        fill="#0f172a"
        fontFamily="ui-sans-serif, system-ui"
      >
        {formatRupeesCompact(delta)}
      </text>
    );
  }
  if (delta === 0) {
    return (
      <text
        x={cx}
        y={y}
        textAnchor="middle"
        fontSize="9"
        fontWeight={500}
        fill="#94a3b8"
        fontFamily="ui-sans-serif, system-ui"
      >
        ₹0
      </text>
    );
  }
  const sign = delta > 0 ? '+' : '−';
  const fill = kind === 'positive' ? '#047857' : '#b91c1c';
  return (
    <text
      x={cx}
      y={y}
      textAnchor="middle"
      fontSize="9"
      fontWeight={600}
      fill={fill}
      fontFamily="ui-sans-serif, system-ui"
    >
      {sign}{formatRupeesCompact(Math.abs(delta))}
    </text>
  );
}

function formatYTick(v: number): string {
  const lakh = v / 100_000;
  if (lakh === 0) return '₹0';
  if (Math.abs(lakh) >= 1) return `₹${Math.round(lakh)}L`;
  return `₹${Math.round(v / 1000)}K`;
}

/**
 * Round up to a "nice" scale ceiling — e.g. 37.84L → 40L, 6.3L → 7L —
 * so tick marks land on readable values instead of awkward fractions.
 */
function niceCeiling(v: number): number {
  if (v === 0) return 100_000;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const scaled = v / pow;
  let nice: number;
  if (scaled <= 1) nice = 1;
  else if (scaled <= 2) nice = 2;
  else if (scaled <= 2.5) nice = 2.5;
  else if (scaled <= 5) nice = 5;
  else nice = 10;
  return nice * pow;
}
