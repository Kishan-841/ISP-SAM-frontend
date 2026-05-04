/**
 * Indian-style compact rupee formatter.
 *
 *   0          → ₹0
 *   850        → ₹850
 *   8,000      → ₹8K
 *   45,000     → ₹45K
 *   1,50,000   → ₹1.5L
 *   35,80,000  → ₹35.8L
 *   1,00,00,000 → ₹1Cr
 *   1,37,40,000 → ₹1.37Cr
 *
 * Negatives: a leading minus sign, then the same suffix logic.
 *   -30,00,000 → −₹30L
 *
 * The compact form intentionally drops paise; for exact display use
 * `formatRupees` instead.
 */
export function formatRupeesCompact(
  value: number,
  opts: { signed?: boolean } = {},
): string {
  if (!Number.isFinite(value) || value === 0) return '₹0';
  // signed=true forces an explicit + on positive numbers (used in delta cards
  // where direction is the headline). Default just shows − for negatives.
  let sign = value < 0 ? '−' : '';
  if (opts.signed && value > 0) sign = '+';
  const abs = Math.abs(value);

  if (abs >= 1_00_00_000) {
    // ≥ 1 crore
    return `${sign}₹${trim(abs / 1_00_00_000)}Cr`;
  }
  if (abs >= 1_00_000) {
    // ≥ 1 lakh
    return `${sign}₹${trim(abs / 1_00_000)}L`;
  }
  if (abs >= 1_000) {
    return `${sign}₹${trim(abs / 1_000)}K`;
  }
  return `${sign}₹${Math.round(abs)}`;
}

/** Exact rupee format with full Indian grouping. */
export function formatRupees(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '₹0';
  const sign = value < 0 ? '−' : '';
  return `${sign}₹${Math.round(Math.abs(value)).toLocaleString('en-IN')}`;
}

/**
 * Format a value with 0–2 decimals — drops trailing `.0` and `.00`.
 * 35.8  → "35.8"
 * 35    → "35"
 * 1.37  → "1.37"
 * 1.30  → "1.3"
 */
function trim(n: number): string {
  if (n >= 100) return Math.round(n).toString();
  if (n >= 10) return n.toFixed(1).replace(/\.0$/, '');
  return n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
