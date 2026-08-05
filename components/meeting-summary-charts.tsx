'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MeetingSummary, MeetingSummarySamRow } from '../services/meeting-summary';

const COLOR_ONLINE = '#0ea5e9'; // sky-500
const COLOR_OFFLINE = '#6366f1'; // indigo-500

/** Horizontal stacked bar — held meetings per SAM, online vs offline. */
export function MeetingsPerSamChart({ sams }: { sams: MeetingSummarySamRow[] }) {
  const data = [...sams]
    .sort((a, b) => b.held - a.held)
    .map((s) => ({
      name: shortName(s.name),
      Online: s.online,
      Offline: s.offline,
    }));

  const hasData = data.some((d) => d.Online + d.Offline > 0);
  if (!hasData) return <ChartEmpty title="Meetings held per SAM" />;

  return (
    <ChartCard title="Meetings held per SAM" note="Online vs offline">
      <ResponsiveContainer width="100%" height={Math.max(220, data.length * 52)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 16, bottom: 4 }}>
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
          <Bar dataKey="Online" stackId="a" name="Online" fill={COLOR_ONLINE} />
          <Bar dataKey="Offline" stackId="a" name="Offline" fill={COLOR_OFFLINE} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Vertical stacked bar — meetings held per month over the trailing 6 months. */
export function MeetingsTrendChart({ trend }: { trend: MeetingSummary['trend'] }) {
  const data = trend.map((t) => ({
    name: monthLabel(t.month),
    Online: t.online,
    Offline: t.offline,
  }));

  const hasData = data.some((d) => d.Online + d.Offline > 0);
  if (!hasData) return <ChartEmpty title="Meetings per month" />;

  return (
    <ChartCard title="Meetings per month" note="Last 6 months · online vs offline">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#374151', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            width={32}
          />
          <Tooltip
            cursor={{ fill: '#f9fafb' }}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="Online" stackId="a" name="Online" fill={COLOR_ONLINE} />
          <Bar dataKey="Offline" stackId="a" name="Offline" fill={COLOR_OFFLINE} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
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
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {note && <span className="text-[11px] text-gray-400">{note}</span>}
      </div>
      {children}
    </div>
  );
}

function ChartEmpty({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5 min-h-[220px] flex flex-col">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="flex-1 grid place-items-center text-sm text-gray-400">
        No meetings in this range.
      </div>
    </div>
  );
}

function shortName(name: string): string {
  if (name.length <= 18) return name;
  return name.slice(0, 16) + '…';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-08" → "Aug '26". */
function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  const idx = Number(m) - 1;
  const label = MONTHS[idx] ?? m;
  return `${label} '${(y ?? '').slice(2)}`;
}
