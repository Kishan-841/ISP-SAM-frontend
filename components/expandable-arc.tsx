'use client';

import { useState } from 'react';
import { formatRupees, formatRupeesCompact } from '../lib/format-rupees';

/**
 * ARC value that shows the compact form (₹15.6Cr) by default and toggles to
 * the exact Indian-grouped figure (₹15,57,70,000) on click. The exact figure
 * is also exposed as a `title` so desktop users see it on hover without
 * clicking.
 *
 * Why a button: the stat cards on the dashboards are wrapped in <Link>s, so
 * a bare onClick handler would also navigate the user away. We render a
 * <button> with stopPropagation so clicking the value toggles the format
 * but clicking anywhere else on the card still follows the card's link.
 *
 * Precision note: backend rounds ARC sums to ₹1K via `roundLakh` before
 * sending them to the frontend, so the "exact" figure shown here is exact to
 * ±₹500. Adequate for displaying Cr/L-scale numbers without misleading the
 * viewer that we have sub-₹500 precision.
 */
export function ExpandableArc({
  value,
  signed = false,
  className = '',
}: {
  value: number;
  signed?: boolean;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const compact = formatRupeesCompact(value, { signed });
  const exactBase = formatRupees(value);
  // Match formatRupeesCompact's signed=+ on positive values for the exact form.
  const exact = signed && value > 0 ? `+${exactBase.replace('₹', '₹')}` : exactBase;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setExpanded((v) => !v);
      }}
      title={expanded ? compact : exact}
      aria-label={`ARC ${compact} (exact ${exact}). Click to ${expanded ? 'collapse' : 'expand'}.`}
      className={`${className} cursor-pointer rounded-sm text-left tabular-nums decoration-dotted underline-offset-4 transition-colors hoverable:hover:underline focus-visible:underline focus-visible:outline-none`}
    >
      {expanded ? exact : compact}
    </button>
  );
}
