const TONES: Record<string, string> = {
  'Very High': 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  High: 'bg-green-50 text-green-700 ring-green-100',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-100',
  Low: 'bg-orange-50 text-orange-700 ring-orange-100',
  'Very Low': 'bg-red-50 text-red-700 ring-red-100',
};

/** Coloured pill for a feedback interest level. */
export function InterestPill({ level }: { level: string | null }) {
  if (!level) return <span className="text-xs text-gray-300">—</span>;
  const tone = TONES[level] ?? 'bg-gray-50 text-gray-600 ring-gray-100';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 whitespace-nowrap ${tone}`}
    >
      {level}
    </span>
  );
}
