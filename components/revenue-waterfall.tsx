'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatRupees } from '../lib/format-rupees';

// Distinct hue per bar so each commercial event reads at a glance.
const COLOR_START = '#1e40af';        // blue-800
const COLOR_UPGRADES = '#10b981';     // emerald-500
const COLOR_DOWNGRADES = '#f59e0b';   // amber-500
const COLOR_RATE_REV = '#8b5cf6';     // violet-500
const COLOR_TERMINATIONS = '#dc2626'; // red-600
const COLOR_END = '#0d9488';          // teal-600

export type WaterfallInput = {
  startArcRupees: number;
  upgradesArcRupees: number;       // positive
  downgradesArcRupees: number;     // already-positive magnitude
  rateRevisionsArcRupees: number;  // already-positive magnitude
  terminationsArcRupees: number;   // already-positive magnitude
  endArcRupees: number;
};

/*
 * Proper waterfall — each middle bar floats between consecutive running
 * totals so the chart reads left-to-right as one continuous story.
 *
 * Implementation: recharts' Bar renders a "floating" bar when the value at
 * dataKey is a tuple `[low, high]`. So we precompute the running totals
 * and emit a `range` tuple per category. Zero-magnitude rows collapse to
 * `[x, x]` (nothing visible). No stacking trickery, no transparent spacer
 * that bleeds colour from the value bar's Cells.
 */
type Row = {
  name: string;
  range: [number, number];
  fill: string;
  /** Signed delta in rupees relative to running total — used by the tooltip. */
  signedDelta: number;
};

export function RevenueWaterfall({ input }: { input: WaterfallInput }) {
  const start = input.startArcRupees;
  const ups = input.upgradesArcRupees;
  const downs = input.downgradesArcRupees;
  const rev = input.rateRevisionsArcRupees;
  const term = input.terminationsArcRupees;

  // Running totals after each step.
  const afterUps = start + ups;
  const afterDowns = afterUps - downs;
  const afterRev = afterDowns - rev;
  const afterTerm = afterRev - term;

  const data: Row[] = [
    { name: 'Start of Period', range: [0, start], fill: COLOR_START, signedDelta: start },
    { name: 'Upgrades', range: [start, afterUps], fill: COLOR_UPGRADES, signedDelta: ups },
    { name: 'Downgrades', range: [afterDowns, afterUps], fill: COLOR_DOWNGRADES, signedDelta: -downs },
    { name: 'Rate Rev.', range: [afterRev, afterDowns], fill: COLOR_RATE_REV, signedDelta: -rev },
    { name: 'Disconnections', range: [afterTerm, afterRev], fill: COLOR_TERMINATIONS, signedDelta: -term },
    { name: 'End of Period', range: [0, input.endArcRupees], fill: COLOR_END, signedDelta: input.endArcRupees },
  ];

  // Y-axis domain: a little headroom above the maximum running total so the
  // tallest bar doesn't kiss the top gridline.
  const maxY = Math.max(start, afterUps, afterDowns, afterRev, afterTerm, input.endArcRupees);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatLakh}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            width={50}
            domain={[0, Math.ceil(maxY * 1.1)]}
          />
          <Tooltip
            cursor={{ fill: '#f9fafb' }}
            contentStyle={{ borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12 }}
            formatter={(_value, _name, ctx) => {
              const delta = (ctx?.payload as Row | undefined)?.signedDelta ?? 0;
              if (delta === 0) return ['₹0', 'ARC change'];
              const sign = delta > 0 ? '+' : '−';
              return [`${sign}${formatRupees(Math.abs(delta))}`, 'ARC change'];
            }}
          />
          {/* Reference line at y=0 makes the floating bars sit on something */}
          <ReferenceLine y={0} stroke="#d1d5db" />
          <Bar dataKey="range" radius={[3, 3, 0, 0]}>
            {data.map((row) => (
              <Cell key={row.name} fill={row.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-center text-xs text-gray-400 mt-2">
        Each bar shows the change applied to the running ARC.
      </p>
    </div>
  );
}

function formatLakh(v: number): string {
  const lakh = v / 100_000;
  if (lakh === 0) return '₹0';
  if (Math.abs(lakh) >= 1) return `₹${Math.round(lakh)}L`;
  return `₹${(v / 1000).toFixed(0)}K`;
}
