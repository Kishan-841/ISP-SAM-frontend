import { ShieldCheck, ShieldAlert } from 'lucide-react';

/**
 * Compact pill that shows actual net-churn % against a SAM's allowable
 * ceiling. Used in the team-performance table and on the per-SAM detail
 * page. The colour is driven entirely by the backend's `churn_status`
 * field so the visual matches the data in one place — don't recompute
 * `actual <= allowable` here, that's the service's job.
 *
 * Format: `actual% / allowable%` — e.g. `2.3% / 7%`. We deliberately
 * surface BOTH numbers so the reader can do the headroom math at a
 * glance without an extra column.
 */
export function ChurnPill({
  actualPercent,
  allowablePercent,
  status,
  size = 'sm',
}: {
  actualPercent: number;
  allowablePercent: number;
  status: 'under_budget' | 'over_budget';
  size?: 'sm' | 'md';
}) {
  const isOver = status === 'over_budget';
  const tone = isOver
    ? 'bg-red-50 text-red-700 ring-red-100'
    : 'bg-emerald-50 text-emerald-700 ring-emerald-100';
  const Icon = isOver ? ShieldAlert : ShieldCheck;
  const iconSize = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';
  const padding = size === 'md' ? 'px-2.5 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1 ${padding} rounded-full font-semibold ring-1 tabular-nums ${tone}`}
      title={`Net churn ${fmt(actualPercent)}% of start-of-period ARC vs ${fmt(allowablePercent)}% allowable`}
    >
      <Icon className={iconSize} />
      <span>{fmt(actualPercent)}%</span>
      <span className="opacity-50">/</span>
      <span className="opacity-70">{fmt(allowablePercent)}%</span>
    </span>
  );
}

function fmt(n: number): string {
  // Strip trailing zero on integers (7.00 → "7"), keep 2 dp otherwise.
  const rounded = Math.round(n * 100) / 100;
  if (Number.isInteger(rounded)) return rounded.toString();
  return rounded.toFixed(rounded.toFixed(1).endsWith('0') ? 1 : 2);
}
