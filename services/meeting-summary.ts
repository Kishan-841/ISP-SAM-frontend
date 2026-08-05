import { apiGet, type ApiOpts } from './api-client';

export type MeetingSummarySamRow = {
  samId: string;
  name: string;
  held: number;
  online: number;
  offline: number;
  customersMet: number;
  /** Mean hours from meeting held → MOM sent. null when no MOMs sent. */
  avgMomTurnaroundHours: number | null;
};

export type MeetingSummary = {
  range: { from: string | null; to: string | null };
  team: {
    held: number;
    online: number;
    offline: number;
    customersMet: number;
    avgMomTurnaroundHours: number | null;
  };
  sams: MeetingSummarySamRow[];
  /** Trailing 6 months, oldest → newest. month = "YYYY-MM". */
  trend: Array<{ month: string; online: number; offline: number }>;
};

/**
 * Fetch meeting analytics. `from`/`to` are YYYY-MM-DD (inclusive); omit both for
 * all-time. Backend windows by heldAt and scopes SAMs by requester role.
 */
export function getMeetingSummary(
  filters: { from?: string; to?: string } = {},
  opts: ApiOpts = {},
) {
  const qs = new URLSearchParams();
  if (filters.from) qs.set('from', filters.from);
  if (filters.to) qs.set('to', filters.to);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return apiGet<MeetingSummary>(`/dashboard/meeting-summary${suffix}`, opts);
}
