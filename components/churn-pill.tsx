import { Minus, ShieldAlert, ShieldCheck, TrendingUp } from 'lucide-react';

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
 * Five visual states (richest first — growth deliberately stands out as
 * its own celebration tone, not "yet-another-shade-of-green"):
 *
 *   - growth (deep emerald, ↑)    : netChurn < 0 — upgrades outpaced
 *                                    losses; the SAM grew their book.
 *                                    Shown as `↑|netChurn|% / allowable%`
 *                                    so the minus sign doesn't read as
 *                                    a warning to non-finance eyes.
 *   - comfortably under (emerald) : headroom ≥ APPROACHING_LINE_PERCENT
 *   - approaching the line (amber): 0 ≤ headroom < APPROACHING_LINE_PERCENT
 *   - over budget (red)           : headroom < 0
 *   - noBook (gray, `—`)          : startOfPeriodArc === 0
 *
 * The pill computes its own tone from the inputs so callers can't
 * accidentally pass `status=under_budget` while showing red numbers.
 * The backend's `churnStatus` field is still authoritative for the
 * "samsOverBudget" tally — amber and growth are purely visual hints.
 *
 * Format: `actual% / allowable%` — e.g. `2.3% / 7%`. We surface BOTH
 * numbers so the reader can do the headroom math at a glance. When
 * growth, `actual` is shown as its absolute value (the up-arrow icon
 * already conveys the direction).
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
  const isGrowth = actualPercent < 0;
  const isOver = headroom < 0;
  // Approaching only fires when actively losing (not growing) AND the
  // ceiling is close. A SAM growing their book is never "approaching" the
  // churn ceiling no matter how small the growth.
  const isApproaching = !isOver && !isGrowth && headroom < APPROACHING_LINE_PERCENT;

  const tone = isGrowth
    ? 'bg-emerald-100 text-emerald-800 ring-emerald-200'
    : isOver
      ? 'bg-red-50 text-red-700 ring-red-100'
      : isApproaching
        ? 'bg-amber-50 text-amber-700 ring-amber-100'
        : 'bg-emerald-50 text-emerald-700 ring-emerald-100';
  const Icon = isGrowth
    ? TrendingUp
    : isOver || isApproaching
      ? ShieldAlert
      : ShieldCheck;
  // Drop the minus sign on growth — the up-arrow icon already conveys
  // direction, and "↑0.47%" reads as "grew by 0.47%" instead of looking
  // like a negative number that might be bad.
  const displayActual = isGrowth ? Math.abs(actualPercent) : actualPercent;
  const tooltip = isGrowth
    ? `Grew the book by ${fmt(Math.abs(actualPercent))}% — net upgrades exceeded losses. Allowable ceiling ${fmt(allowablePercent)}%.`
    : `Net churn ${fmt(actualPercent)}% of start-of-period ARC vs ${fmt(allowablePercent)}% allowable · headroom ${
        headroom >= 0 ? '+' : ''
      }${fmt(headroom)}%`;

  return (
    <span className={`${baseClass} ${tone}`} title={tooltip}>
      <Icon className={iconSize} />
      <span>{fmt(displayActual)}%</span>
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
