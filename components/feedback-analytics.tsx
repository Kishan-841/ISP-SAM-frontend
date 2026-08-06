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
import { Star, MessageSquareText, Users } from 'lucide-react';
import type { FeedbackListRow } from '../services/feedback';

const LEVELS = ['Very High', 'High', 'Medium', 'Low', 'Very Low'] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_COLORS: Record<Level, string> = {
  'Very High': '#059669', // emerald-600
  High: '#22c55e', // green-500
  Medium: '#f59e0b', // amber-500
  Low: '#f97316', // orange-500
  'Very Low': '#dc2626', // red-600
};

type SamAgg = {
  samId: string;
  name: string;
  count: number;
  avgScore: number | null;
  avgNps: number | null;
  interest: Record<Level, number>;
};

function emptyInterest(): Record<Level, number> {
  return { 'Very High': 0, High: 0, Medium: 0, Low: 0, 'Very Low': 0 };
}

function aggregate(rows: FeedbackListRow[]): SamAgg[] {
  const byId = new Map<string, FeedbackListRow[]>();
  for (const r of rows) {
    const arr = byId.get(r.sam.id) ?? [];
    arr.push(r);
    byId.set(r.sam.id, arr);
  }
  const out: SamAgg[] = [];
  for (const [samId, rs] of byId) {
    const scores = rs.map((r) => r.overallScore).filter((v): v is number => v !== null);
    const nps = rs.map((r) => r.npsScore).filter((v): v is number => v !== null);
    const interest = emptyInterest();
    for (const r of rs) {
      if (r.interestLevel && r.interestLevel in interest) interest[r.interestLevel as Level] += 1;
    }
    out.push({
      samId,
      name: rs[0]!.sam.name,
      count: rs.length,
      avgScore: scores.length ? round2(scores.reduce((s, v) => s + v, 0) / scores.length) : null,
      avgNps: nps.length ? Math.round((nps.reduce((s, v) => s + v, 0) / nps.length) * 10) / 10 : null,
      interest,
    });
  }
  return out.sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0));
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function scoreColor(v: number): string {
  if (v >= 4.5) return '#059669';
  if (v >= 3.5) return '#22c55e';
  if (v >= 2.5) return '#f59e0b';
  if (v >= 1.5) return '#f97316';
  return '#dc2626';
}

export function FeedbackAnalytics({ rows }: { rows: FeedbackListRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-8 text-center">
        <MessageSquareText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-700">No feedback to analyse yet</p>
        <p className="text-xs text-gray-500 mt-1">Per-SAM analytics appear once responses come in.</p>
      </div>
    );
  }

  const sams = aggregate(rows);
  const allScores = rows.map((r) => r.overallScore).filter((v): v is number => v !== null);
  const overallAvg = allScores.length ? round2(allScores.reduce((s, v) => s + v, 0) / allScores.length) : null;

  const scoreData = sams.map((s) => ({ name: shortName(s.name), score: s.avgScore ?? 0 }));
  const interestData = sams.map((s) => ({ name: shortName(s.name), ...s.interest }));

  return (
    <div className="flex flex-col gap-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total responses" value={String(rows.length)} icon={MessageSquareText} />
        <StatCard
          label="Overall avg score"
          value={overallAvg !== null ? `${overallAvg.toFixed(2)} / 5` : '—'}
          icon={Star}
        />
        <StatCard label="SAMs with feedback" value={String(sams.length)} icon={Users} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Average score per SAM" note="Out of 5">
          <ResponsiveContainer width="100%" height={Math.max(200, sams.length * 52)}>
            <BarChart data={scoreData} layout="vertical" margin={{ top: 4, right: 28, left: 16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 5]}
                ticks={[0, 1, 2, 3, 4, 5]}
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
                formatter={(v) => [Number(v).toFixed(2), 'Avg score']}
              />
              <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                {scoreData.map((d, i) => (
                  <Cell key={i} fill={scoreColor(d.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Responses by interest level" note="Stacked count per SAM">
          <ResponsiveContainer width="100%" height={Math.max(200, sams.length * 52)}>
            <BarChart data={interestData} layout="vertical" margin={{ top: 4, right: 24, left: 16, bottom: 4 }}>
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
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              {LEVELS.map((lvl, i) => (
                <Bar
                  key={lvl}
                  dataKey={lvl}
                  stackId="a"
                  name={lvl}
                  fill={LEVEL_COLORS[lvl]}
                  radius={i === LEVELS.length - 1 ? [0, 6, 6, 0] : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Per-SAM table */}
      <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-50/60 border-b border-gray-100">
              <tr>
                <Th>SAM</Th>
                <Th align="right">Responses</Th>
                <Th align="center">Avg score</Th>
                <Th align="center">Interest spread</Th>
                <Th align="right">Avg NPS</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sams.map((s) => (
                <tr key={s.samId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{s.name}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-gray-700">{s.count}</td>
                  <td className="px-5 py-3.5 text-center">
                    {s.avgScore !== null ? (
                      <span
                        className="inline-flex items-center gap-1 tabular-nums font-semibold"
                        style={{ color: scoreColor(s.avgScore) }}
                      >
                        <Star className="w-3.5 h-3.5" style={{ color: scoreColor(s.avgScore) }} />
                        {s.avgScore.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {LEVELS.filter((l) => s.interest[l] > 0).map((l) => (
                        <span
                          key={l}
                          className="inline-flex items-center gap-1 text-[11px] tabular-nums text-gray-600"
                          title={l}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ background: LEVEL_COLORS[l] }} />
                          {s.interest[l]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-gray-700">
                    {s.avgNps !== null ? s.avgNps.toFixed(1) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Star;
}) {
  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-200 px-5 py-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="w-10 h-10 rounded-lg bg-orange-50 grid place-items-center text-brand-600 flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

function ChartCard({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
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

function Th({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  const a = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-900 whitespace-nowrap ${a}`}>
      {children}
    </th>
  );
}

function shortName(name: string): string {
  return name.length <= 18 ? name : name.slice(0, 16) + '…';
}
