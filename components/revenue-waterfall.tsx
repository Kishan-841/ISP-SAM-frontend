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

const COLOR_TOTAL = '#1e3a8a';      // navy
const COLOR_POSITIVE = '#10b981';   // emerald
const COLOR_NEGATIVE = '#ef4444';   // red

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
    { name: 'Start of Period', value: input.startArcRupees, fill: COLOR_TOTAL },
    { name: 'Upgrades', value: input.upgradesArcRupees, fill: COLOR_POSITIVE },
    { name: 'Downgrades', value: -input.downgradesArcRupees, fill: COLOR_NEGATIVE },
    { name: 'Rate Rev. ↓', value: -input.rateRevisionsArcRupees, fill: COLOR_NEGATIVE },
    { name: 'Terminations', value: -input.terminationsArcRupees, fill: COLOR_NEGATIVE },
    { name: 'End of Period', value: input.endArcRupees, fill: COLOR_TOTAL },
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

function formatRupees(v: number): string {
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}
