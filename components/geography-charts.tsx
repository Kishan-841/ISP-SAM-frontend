'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { GeoCityRow, GeoZoneRow } from '../services/geography';
import { formatRupeesCompact, formatRupees } from '../lib/format-rupees';

/*
 * Palette — validated with the dataviz skill's checker against a white
 * surface (lightness band, chroma floor, CVD separation, normal-vision
 * floor, 3:1 contrast: all PASS):
 *
 *   node scripts/validate_palette.js "#2a78d6,#eb6834" --mode light --surface "#ffffff"
 *
 * ARC and customer-count are different measures on different scales, so they
 * get two charts rather than one dual-axis chart. Each single-series chart
 * drops the legend (its title names the series); only the Base/New stack
 * carries one.
 */
const SERIES_ARC = '#2a78d6'; // blue — sequential slot, magnitude
const SERIES_BASE = '#2a78d6';
const SERIES_NEW = '#eb6834'; // orange — categorical slot 2
const UNMAPPED = '#9ca3af'; // gray-400 — "no data yet" is not a series
const GRID = '#e5e7eb';
const SURFACE = '#ffffff';

const TOP_CITIES = 10;

/** Horizontal bar — ARC per zone, largest first. */
export function ArcByZoneChart({ zones }: { zones: GeoZoneRow[] }) {
  const data = zones.map((z) => ({
    name: z.name,
    arc: z.totalArc,
    customers: z.customerCount,
    share: z.arcSharePercent,
  }));

  if (data.length === 0) return <ChartEmpty title="ARC by zone" />;

  return (
    <ChartCard title="ARC by zone" note={`${data.length} zone${data.length === 1 ? '' : 's'} · live book`}>
      <ResponsiveContainer width="100%" height={Math.max(220, data.length * 46)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v: number) => formatRupeesCompact(v)}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={{ stroke: GRID }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#374151', fontSize: 12 }}
            axisLine={{ stroke: GRID }}
            tickLine={false}
            width={128}
          />
          <Tooltip
            cursor={{ fill: '#f9fafb' }}
            contentStyle={{ borderRadius: 8, border: `1px solid ${GRID}`, fontSize: 12 }}
            formatter={((value: number, _n: string, entry: { payload?: (typeof data)[number] }) => [
              `${formatRupees(value)} · ${entry.payload?.customers ?? 0} customers · ${entry.payload?.share ?? 0}% of mapped ARC`,
              'ARC',
            ]) as never}
          />
          <Bar
            dataKey="arc"
            name="ARC"
            fill={SERIES_ARC}
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="arc"
              position="right"
              formatter={((v: number) => formatRupeesCompact(v)) as never}
              style={{ fill: '#374151', fontSize: 11, fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/**
 * Horizontal stacked bar — customer headcount per zone, split by kitty.
 * Separate from the ARC chart on purpose: two measures of different scale
 * never share an axis.
 */
export function CustomersByZoneChart({ zones }: { zones: GeoZoneRow[] }) {
  // Deliberately NOT re-sorted by headcount: keeping the ARC ordering means
  // this chart and "ARC by zone" line up row for row.
  const data = zones.map((z) => ({ name: z.name, Base: z.baseCount, New: z.newCount }));

  if (data.length === 0) return <ChartEmpty title="Customers by zone" />;

  return (
    <ChartCard title="Customers by zone" note="Base vs New kitty">
      <ResponsiveContainer width="100%" height={Math.max(220, data.length * 46)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 32, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={{ stroke: GRID }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#374151', fontSize: 12 }}
            axisLine={{ stroke: GRID }}
            tickLine={false}
            width={128}
          />
          <Tooltip
            cursor={{ fill: '#f9fafb' }}
            contentStyle={{ borderRadius: 8, border: `1px solid ${GRID}`, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          {/* 2px surface-coloured stroke = the 2px gap between stacked fills. */}
          <Bar
            dataKey="Base"
            stackId="k"
            name="Base"
            fill={SERIES_BASE}
            stroke={SURFACE}
            strokeWidth={2}
            maxBarSize={24}
            isAnimationActive={false}
          />
          <Bar
            dataKey="New"
            stackId="k"
            name="New"
            fill={SERIES_NEW}
            stroke={SURFACE}
            strokeWidth={2}
            radius={[0, 4, 4, 0]}
            maxBarSize={24}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Horizontal bar — the biggest cities by ARC, capped at ten. */
export function TopCitiesChart({ cities }: { cities: GeoCityRow[] }) {
  const data = cities.slice(0, TOP_CITIES).map((c) => ({
    name: c.name,
    zone: c.zone,
    arc: c.totalArc,
    customers: c.customerCount,
  }));

  if (data.length === 0) return <ChartEmpty title="Top cities by ARC" />;

  const note =
    cities.length > TOP_CITIES
      ? `Top ${TOP_CITIES} of ${cities.length} cities`
      : `${cities.length} cit${cities.length === 1 ? 'y' : 'ies'}`;

  return (
    <ChartCard title="Top cities by ARC" note={note}>
      <ResponsiveContainer width="100%" height={Math.max(220, data.length * 44)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v: number) => formatRupeesCompact(v)}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={{ stroke: GRID }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#374151', fontSize: 12 }}
            axisLine={{ stroke: GRID }}
            tickLine={false}
            width={150}
          />
          <Tooltip
            cursor={{ fill: '#f9fafb' }}
            contentStyle={{ borderRadius: 8, border: `1px solid ${GRID}`, fontSize: 12 }}
            formatter={((value: number, _n: string, entry: { payload?: (typeof data)[number] }) => [
              `${formatRupees(value)} · ${entry.payload?.customers ?? 0} customers · zone ${entry.payload?.zone ?? '—'}`,
              'ARC',
            ]) as never}
          />
          <Bar
            dataKey="arc"
            name="ARC"
            fill={SERIES_ARC}
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="arc"
              position="right"
              formatter={((v: number) => formatRupeesCompact(v)) as never}
              style={{ fill: '#374151', fontSize: 11, fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/**
 * Where the ARC sits: one bar per zone plus a grey "Not mapped" segment.
 * Grey is deliberate — unmapped is missing data, not another zone.
 */
export function ArcCoverageBar({
  zones,
  unmapped,
  totalArc,
}: {
  zones: GeoZoneRow[];
  unmapped: { customerCount: number; totalArc: number };
  totalArc: number;
}) {
  if (totalArc <= 0) return null;

  const tint = (arc: number) => Math.max(0.45, Math.min(1, 0.45 + (arc / totalArc) * 100 / 60));
  const segments = [
    ...zones.map((z) => ({
      name: z.name,
      arc: z.totalArc,
      color: SERIES_ARC,
      opacity: tint(z.totalArc),
    })),
    ...(unmapped.totalArc > 0
      ? [{ name: 'Not mapped', arc: unmapped.totalArc, color: UNMAPPED, opacity: 1 }]
      : []),
  ];

  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Where the ARC sits</h3>
        <span className="text-[11px] text-gray-400">{formatRupees(totalArc)} live ARC</span>
      </div>
      <div className="flex w-full h-7 rounded-md overflow-hidden gap-[2px] bg-gray-100">
        {segments.map((s) => {
          const pct = (s.arc / totalArc) * 100;
          return (
            <div
              key={s.name}
              className="h-full first:rounded-l-md last:rounded-r-md"
              style={{ width: `${pct}%`, backgroundColor: s.color, opacity: s.opacity }}
              title={`${s.name} — ${formatRupees(s.arc)} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {segments.slice(0, 6).map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1.5 text-[11px] text-gray-600">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: s.color, opacity: s.opacity }}
            />
            {s.name}
            <span className="text-gray-400 tabular-nums">
              {((s.arc / totalArc) * 100).toFixed(1)}%
            </span>
          </span>
        ))}
        {segments.length > 6 && (
          <span className="text-[11px] text-gray-400">+{segments.length - 6} more</span>
        )}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {note && <span className="text-[11px] text-gray-400 shrink-0">{note}</span>}
      </div>
      {children}
    </div>
  );
}

function ChartEmpty({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5 min-h-[220px] flex flex-col">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="flex-1 grid place-items-center text-center text-sm text-gray-400 px-4">
        No customer carries a zone yet. Zones arrive from the CRM on activation.
      </div>
    </div>
  );
}
