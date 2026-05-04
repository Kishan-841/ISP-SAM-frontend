'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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

export function RevenueWaterfall({ input }: { input: WaterfallInput }) {
  const data = [
    { name: 'Start of Period', value: input.startArcRupees, fill: COLOR_START },
    { name: 'Upgrades', value: input.upgradesArcRupees, fill: COLOR_UPGRADES },
    { name: 'Downgrades', value: -input.downgradesArcRupees, fill: COLOR_DOWNGRADES },
    { name: 'Rate Rev. ↓', value: -input.rateRevisionsArcRupees, fill: COLOR_RATE_REV },
    { name: 'Terminations', value: -input.terminationsArcRupees, fill: COLOR_TERMINATIONS },
    { name: 'End of Period', value: input.endArcRupees, fill: COLOR_END },
  ];

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
          />
          <Tooltip
            cursor={{ fill: '#f9fafb' }}
            contentStyle={{ borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12 }}
            formatter={(value) => [formatRupees(Number(value)), 'ARC']}
          />
          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-center text-xs text-gray-400 mt-2">Click a bar to drill down.</p>
    </div>
  );
}

function formatLakh(v: number): string {
  const lakh = v / 100_000;
  if (lakh === 0) return '₹0';
  if (Math.abs(lakh) >= 1) return `₹${Math.round(lakh)}L`;
  return `₹${(v / 1000).toFixed(0)}K`;
}

