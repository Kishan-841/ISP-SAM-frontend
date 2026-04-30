export function Within48hBadge({
  heldAt,
  momSentAt,
}: {
  heldAt: string | null;
  momSentAt: string | null;
}) {
  if (!heldAt || !momSentAt) return <span className="text-gray-400">—</span>;
  const ms = new Date(momSentAt).getTime() - new Date(heldAt).getTime();
  const within = Math.abs(ms) <= 48 * 60 * 60 * 1000;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        within ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
      }`}
    >
      {within ? 'Yes' : 'No'}
    </span>
  );
}
