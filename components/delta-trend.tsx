import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

/**
 * Inline directional indicator for a numeric delta. Renders an up arrow
 * (emerald) when the delta is positive, a down arrow (red) when negative,
 * and a flat dash (gray) when zero. The icon colour is paired with the
 * children's text colour so a "−₹5L" delta reads red end-to-end.
 *
 * Usage:
 *   <DeltaTrend value={netDelta}>
 *     <ExpandableArc value={netDelta} signed /> since April 1
 *   </DeltaTrend>
 */
export function DeltaTrend({
  value,
  children,
  size = 'sm',
}: {
  value: number;
  children: React.ReactNode;
  size?: 'sm' | 'md';
}) {
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  const colorClass =
    value > 0
      ? 'text-emerald-600'
      : value < 0
        ? 'text-red-600'
        : 'text-gray-500';
  const iconSize = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  return (
    <span className={`inline-flex items-center gap-1 ${colorClass}`}>
      <Icon className={`${iconSize} shrink-0`} aria-hidden="true" />
      {children}
    </span>
  );
}
