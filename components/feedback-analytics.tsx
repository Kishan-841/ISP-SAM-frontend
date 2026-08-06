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
import { Star, MessageSquareText, Users, TrendingUp } from 'lucide-react';
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

const round2 = (n: number) => Math.round(n * 100) / 100;

function scoreColor(v: number): string {
  if (v >= 4.5) return '#059669';
  if (v >= 3.5) return '#22c55e';
  if (v >= 2.5) return '#f59e0b';
  if (v >= 1.5) return '#f97316';
  return '#dc2626';
}

function bandForScore(v: number): Level {
  if (v >= 4.5) return 'Very High';
  if (v >= 3.5) return 'High';
  if (v >= 2.5) return 'Medium';
  if (v >= 1.5) return 'Low';
  return 'Very Low';
}

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

export function FeedbackAnalytics({ rows }: { rows: FeedbackListRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl ring-1 ring-gray-200 p-10 text-center">
        <MessageSquareText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-700">No feedback to analyse</p>
        <p className="text-xs text-gray-500 mt-1">Per-SAM analytics appear once responses come in.</p>
      </div>
    );
  }

  const sams = aggregate(rows);
  const allScores = rows.map((r) => r.overallScore).filter((v): v is number => v !== null);
  const overallAvg = allScores.length ? round2(allScores.reduce((s, v) => s + v, 0) / allScores.length) : null;
  const topSam = sams.find((s) => s.avgScore !== null) ?? null;

  const scoreData = sams
    .filter((s) => s.avgScore !== null)
    .map((s) => ({ name: shortName(s.name), score: s.avgScore ?? 0 }));

  return (
    <div className="flex flex-col gap-5">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total responses" value={String(rows.length)} icon={MessageSquareText} tint="blue" />
        <StatCard
          label="Overall avg score"
          value={overallAvg !== null ? overallAvg.toFixed(2) : '—'}
          suffix={overallAvg !== null ? '/ 5' : undefined}
          icon={Star}
          tint="amber"
        />
        <StatCard
          label="Top SAM"
          value={topSam?.avgScore != null ? topSam.name : '—'}
          suffix={topSam?.avgScore != null ? `${topSam.avgScore.toFixed(1)}★` : undefined}
          icon={TrendingUp}
          tint="emerald"
        />
      </div>

      {/* Avg score comparison chart */}
      {scoreData.length > 0 && (
        <div className="bg-white rounded-2xl ring-1 ring-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Average score per SAM</h3>
            <span className="text-[11px] text-gray-400">Out of 5 · sorted</span>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(180, scoreData.length * 46)}>
            <BarChart data={scoreData} layout="vertical" margin={{ top: 0, right: 32, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 5]}
                ticks={[0, 1, 2, 3, 4, 5]}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#334155', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={128}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(v) => [Number(v).toFixed(2), 'Avg score']}
              />
              <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={18}>
                {scoreData.map((d, i) => (
                  <Cell key={i} fill={scoreColor(d.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-SAM scorecards */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">SAM scorecards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sams.map((s, i) => (
            <ScoreCard key={s.samId} sam={s} rank={i + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

const TINTS: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600',
};

function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  tint,
}: {
  label: string;
  value: string;
  suffix?: string;
  icon: typeof Star;
  tint: keyof typeof TINTS | string;
}) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-gray-200 px-5 py-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-xl font-bold text-gray-900 truncate">
          {value}
          {suffix && <span className="ml-1 text-sm font-medium text-gray-400">{suffix}</span>}
        </p>
      </div>
      <div className={`w-10 h-10 rounded-xl grid place-items-center flex-shrink-0 ${TINTS[tint] ?? TINTS.blue}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

function ScoreCard({ sam, rank }: { sam: SamAgg; rank: number }) {
  const score = sam.avgScore;
  const color = score !== null ? scoreColor(score) : '#94a3b8';
  const band = score !== null ? bandForScore(score) : null;
  const total = LEVELS.reduce((s, l) => s + sam.interest[l], 0);

  return (
    <div className="bg-white rounded-2xl ring-1 ring-gray-200 p-5 hover:ring-gray-300 hover:shadow-sm transition">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="grid place-items-center w-6 h-6 rounded-md bg-gray-100 text-gray-500 text-xs font-bold flex-shrink-0">
          {rank}
        </span>
        <Avatar name={sam.name} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{sam.name}</p>
          <p className="text-xs text-gray-500">
            {sam.count} response{sam.count === 1 ? '' : 's'}
            {sam.avgNps !== null && <span> · NPS {sam.avgNps.toFixed(1)}</span>}
          </p>
        </div>
        {band && (
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{ background: `${color}18`, color }}
          >
            {band}
          </span>
        )}
      </div>

      {/* Score + meter */}
      <div className="mt-4 flex items-end gap-3">
        <div className="flex items-baseline gap-1" style={{ color }}>
          <span className="text-3xl font-bold leading-none tabular-nums">
            {score !== null ? score.toFixed(1) : '—'}
          </span>
          <span className="text-sm font-medium text-gray-400">/ 5</span>
        </div>
        <div className="flex items-center gap-0.5 mb-0.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              className="w-3.5 h-3.5"
              style={{ color: score !== null && i < Math.round(score) ? '#f59e0b' : '#e5e7eb' }}
              fill={score !== null && i < Math.round(score) ? '#f59e0b' : '#e5e7eb'}
            />
          ))}
        </div>
      </div>
      <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: score !== null ? `${(score / 5) * 100}%` : '0%', background: color }}
        />
      </div>

      {/* Interest spread */}
      {total > 0 && (
        <div className="mt-4">
          <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
            {LEVELS.map((l) =>
              sam.interest[l] > 0 ? (
                <div
                  key={l}
                  title={`${l}: ${sam.interest[l]}`}
                  style={{ width: `${(sam.interest[l] / total) * 100}%`, background: LEVEL_COLORS[l] }}
                />
              ) : null,
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {LEVELS.filter((l) => sam.interest[l] > 0).map((l) => (
              <span key={l} className="inline-flex items-center gap-1 text-[11px] text-gray-500 tabular-nums">
                <span className="w-2 h-2 rounded-full" style={{ background: LEVEL_COLORS[l] }} />
                {l} · {sam.interest[l]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const AVATAR_COLORS = [
  'from-rose-500 to-rose-600',
  'from-orange-500 to-orange-600',
  'from-amber-500 to-amber-600',
  'from-emerald-500 to-emerald-600',
  'from-cyan-500 to-cyan-600',
  'from-blue-500 to-blue-600',
  'from-indigo-500 to-indigo-600',
  'from-purple-500 to-purple-600',
];

function Avatar({ name }: { name: string }) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const gradient = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length === 1
      ? parts[0]!.slice(0, 2).toUpperCase()
      : (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  return (
    <div
      className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} text-white font-semibold flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow-sm text-xs`}
    >
      {initials}
    </div>
  );
}

function shortName(name: string): string {
  return name.length <= 18 ? name : name.slice(0, 16) + '…';
}
