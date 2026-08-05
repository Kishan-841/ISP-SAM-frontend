'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatRupees } from '../lib/format-rupees';
import type { SamRow } from '../services/team-performance';

const COLOR_ARC = '#ea580c'; // brand-600 / orange-600
const TYPE_COLORS = {
  UPGRADE: '#10b981',       // emerald-500
  DOWNGRADE: '#f59e0b',     // amber-500
  RATE_REVISION: '#8b5cf6', // violet-500
  DISCONNECTION: '#dc2626', // red-600
} as const;

const TYPE_LABEL = {
  UPGRADE: 'Upgrades',
  DOWNGRADE: 'Downgrades',
  RATE_REVISION: 'Rate Rev.',
  DISCONNECTION: 'Disconnections',
} as const;

/** Horizontal bar — ARC managed by each SAM. */
export function ArcPerSamChart({ sams }: { sams: SamRow[] }) {
  const data = [...sams]
    .sort((a, b) => b.totalArc - a.totalArc)
    .map((s) => ({
      name: shortName(s.name),
      arc: s.totalArc,
      delta: s.arcDelta,
    }));

  if (data.length === 0) return <ChartEmpty title="ARC managed per SAM" />;

  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">ARC managed per SAM</h3>
        <span className="text-[11px] text-gray-400">Annual ₹ · sorted desc</span>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 48)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 16, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={formatLakh}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#374151', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            width={120}
          />
          <Tooltip
            cursor={{ fill: '#fff7ed' }}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
            formatter={(value) => [formatRupees(Number(value)), 'ARC']}
          />
          <Bar dataKey="arc" radius={[0, 6, 6, 0]} fill={COLOR_ARC}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLOR_ARC} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Stacked bar — commercial change counts per SAM, by type. */
export function ChangesPerSamChart({ sams }: { sams: SamRow[] }) {
  const data = [...sams]
    .sort((a, b) => b.totalChanges - a.totalChanges)
    .map((s) => ({
      name: shortName(s.name),
      UPGRADE: s.changes.UPGRADE.count,
      DOWNGRADE: s.changes.DOWNGRADE.count,
      RATE_REVISION: s.changes.RATE_REVISION.count,
      DISCONNECTION: s.changes.DISCONNECTION.count,
    }));

  const hasData = data.some(
    (d) => d.UPGRADE + d.DOWNGRADE + d.RATE_REVISION + d.DISCONNECTION > 0,
  );
  if (!hasData) return <ChartEmpty title="Commercial changes by type" />;

  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Commercial changes by type</h3>
        <span className="text-[11px] text-gray-400">Stacked count per SAM</span>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(220, data.length * 56)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 16, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#374151', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            width={120}
          />
          <Tooltip
            cursor={{ fill: '#f9fafb' }}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="UPGRADE" stackId="a" name={TYPE_LABEL.UPGRADE} fill={TYPE_COLORS.UPGRADE} />
          <Bar
            dataKey="DOWNGRADE"
            stackId="a"
            name={TYPE_LABEL.DOWNGRADE}
            fill={TYPE_COLORS.DOWNGRADE}
          />
          <Bar
            dataKey="RATE_REVISION"
            stackId="a"
            name={TYPE_LABEL.RATE_REVISION}
            fill={TYPE_COLORS.RATE_REVISION}
          />
          <Bar
            dataKey="DISCONNECTION"
            stackId="a"
            name={TYPE_LABEL.DISCONNECTION}
            fill={TYPE_COLORS.DISCONNECTION}
            radius={[0, 6, 6, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartEmpty({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5 min-h-[220px] flex flex-col">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="flex-1 grid place-items-center text-sm text-gray-400">
        No data yet.
      </div>
    </div>
  );
}

function shortName(name: string): string {
  if (name.length <= 18) return name;
  return name.slice(0, 16) + '…';
}

function formatLakh(v: number): string {
  if (v === 0) return '₹0';
  const abs = Math.abs(v);
  if (abs >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)}Cr`;
  if (abs >= 100_000) return `₹${Math.round(v / 100_000)}L`;
  if (abs >= 1_000) return `₹${Math.round(v / 1_000)}K`;
  return `₹${v}`;
}
