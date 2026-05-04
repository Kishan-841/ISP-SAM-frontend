const MONTHS_SHORT = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

/**
 * Format an ISO timestamp into a human-readable string in the user's local timezone.
 * Example: "1 jan 2026, 1.20 am"
 */
export function formatDateTime(input: string | Date | null | undefined): string {
  if (!input) return '—';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '—';

  const day = d.getDate();
  const month = MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();

  const hours24 = d.getHours();
  const minutes = d.getMinutes();
  const period = hours24 < 12 ? 'am' : 'pm';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minutesPadded = String(minutes).padStart(2, '0');

  return `${day} ${month} ${year}, ${hours12}.${minutesPadded} ${period}`;
}

/**
 * Format an ISO timestamp into a date-only string in the user's local timezone.
 * Example: "1 jan 2026"
 */
export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return '—';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}
