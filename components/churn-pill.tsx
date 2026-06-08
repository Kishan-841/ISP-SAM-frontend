import { Minus, ShieldAlert, ShieldCheck } from 'lucide-react';

/**
 * Threshold (% points) below which we render an amber "approaching the
 * line" tone instead of the standard green. The product rule says any
 * net churn within the allowable budget is acceptable, but a SAM who is
 * 0.5% away from their ceiling is materially different from one at 5%
 * away — the amber zone gives SAM_HEADs early warning before incentive
 * is actually at risk.
 *
 * Co-located with the pill (presentation concern, not a business rule)
 * so a future product tweak is a one-line change.
 */
const APPROACHING_LINE_PERCENT = 1.5;

/**
 * Compact pill that shows actual net-churn % against a SAM's allowable
 * ceiling. Used in the team-performance table, the team headline, and
 * the per-SAM detail page.
 *
 * Four visual states:
 *   - `noBook` (gray, `—`)        : `startOfPeriodArc === 0` — there is
 *                                    nothing to measure; rendering "0%"
 *                                    would falsely imply the SAM is on
 *                                    track for incentive.
 *   - over budget (red)           : headroom < 0
 *   - approaching the line (amber): 0 ≤ headroom < APPROACHING_LINE_PERCENT
 *   - comfortably under (emerald) : headroom ≥ APPROACHING_LINE_PERCENT
 *
 * The pill computes its own tone from the inputs so callers can't
 * accidentally pass `status=under_budget` while showing red numbers.
 * The backend's `churnStatus` field is still authoritative for the
 * "samsOverBudget" tally — amber is purely a visual hint.
 *
 * Format: `actual% / allowable%` — e.g. `2.3% / 7%`. We surface BOTH
 * numbers so the reader can do the headroom math at a glance.
 */
export function ChurnPill({
  actualPercent,
  allowablePercent,
  noBook = false,
  size = 'sm',
}: {
  actualPercent: number;
  allowablePercent: number;
  /** True when start-of-period ARC is zero — render the empty `—` state. */
  noBook?: boolean;
  size?: 'sm' | 'md';
}) {
  const iconSize = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';
  const padding = size === 'md' ? 'px-2.5 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  const baseClass = `inline-flex items-center gap-1 ${padding} rounded-full font-semibold ring-1 tabular-nums`;

  if (noBook) {
    return (
      <span
        className={`${baseClass} bg-gray-50 text-gray-400 ring-gray-100`}
        title="No start-of-period ARC — net churn does not apply"
      >
        <Minus className={iconSize} />
        <span>—</span>
      </span>
    );
  }

  const headroom = allowablePercent - actualPercent;
  const isOver = headroom < 0;
  const isApproaching = !isOver && headroom < APPROACHING_LINE_PERCENT;

  const tone = isOver
    ? 'bg-red-50 text-red-700 ring-red-100'
    : isApproaching
      ? 'bg-amber-50 text-amber-700 ring-amber-100'
      : 'bg-emerald-50 text-emerald-700 ring-emerald-100';
  const Icon = isOver || isApproaching ? ShieldAlert : ShieldCheck;
  const tooltip = `Net churn ${fmt(actualPercent)}% of start-of-period ARC vs ${fmt(allowablePercent)}% allowable · headroom ${
    headroom >= 0 ? '+' : ''
  }${fmt(headroom)}%`;

  return (
    <span className={`${baseClass} ${tone}`} title={tooltip}>
      <Icon className={iconSize} />
      <span>{fmt(actualPercent)}%</span>
      <span className="opacity-50">/</span>
      <span className="opacity-70">{fmt(allowablePercent)}%</span>
    </span>
  );
}

function fmt(n: number): string {
  // Strip trailing zero on integers (7.00 → "7"), keep 1 or 2 dp otherwise.
  const rounded = Math.round(n * 100) / 100;
  if (Number.isInteger(rounded)) return rounded.toString();
  return rounded.toFixed(rounded.toFixed(1).endsWith('0') ? 1 : 2);
}
