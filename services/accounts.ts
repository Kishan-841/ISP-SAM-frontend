import { env } from '../lib/env';
import { apiGet, type ApiOpts } from './api-client';

export type AccountOwner = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SAM_HEAD' | 'SAM';
};

export type Account = {
  id: string;
  clientName: string;
  kittyType: 'BASE' | 'NEW';
  /** Annual ₹ — Decimal serialised as a string. */
  currentArc: string;
  contractStatus:
    | 'ACTIVE'
    | 'EXPIRED'
    | 'TERMINATED'
    | 'PENDING'
    | 'PROBABLE_CHURN'
    | 'DISCONNECTING';
  lastMomDate: string | null;
  lastMeetingDate: string | null;
  onboardingDate: string;
  externalCrmId: string | null;
  // Added in P2.A — populated by Excel import.
  companyName?: string | null;
  email?: string | null;
  mobileNumber?: string | null;
  leadId?: string | null;
  currentPlan?: string | null;
  metadata?: Record<string, unknown> | null;
  // Added in P2.B — auto-generated codes + bandwidth + waterfall snapshot.
  customerCode?: string | null;
  circuitId?: string | null;
  bandwidthMbps?: number | null;
  startOfPeriodArc?: string | null;
  /** Current owner — null when the customer is unassigned (CRM-synced, awaiting triage). */
  samOwnerId?: string | null;
  samOwner?: AccountOwner | null;
};

export type OwnerFilter = 'mine' | 'unassigned' | 'team' | 'all';

export function getAccounts(
  filters: { kittyType?: 'BASE' | 'NEW'; owner?: OwnerFilter } = {},
  opts: ApiOpts = {},
) {
  const params = new URLSearchParams();
  if (filters.kittyType) params.set('kittyType', filters.kittyType);
  if (filters.owner) params.set('owner', filters.owner);
  const qs = params.toString();
  return apiGet<{ accounts: Account[] }>(`/accounts${qs ? `?${qs}` : ''}`, opts);
}

export function getAccount(id: string, opts: ApiOpts = {}) {
  return apiGet<{ account: Account }>(`/accounts/${id}`, opts);
}

/** Browser-side: assign (or unassign with samUserId=null) a customer. */
export async function assignAccount(
  id: string,
  samUserId: string | null,
): Promise<{ account: Account }> {
  const base = typeof window === 'undefined' ? env.internalApiBase : env.apiBase;
  const res = await fetch(`${base}/accounts/${id}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ samUserId }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Assign failed (${res.status}): ${body}`);
  }
  return (await res.json()) as { account: Account };
}

export type TeamMember = { id: string; name: string; email: string };

export async function getTeam(): Promise<TeamMember[]> {
  const base = typeof window === 'undefined' ? env.internalApiBase : env.apiBase;
  const res = await fetch(`${base}/users/team`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load team (${res.status})`);
  const json = (await res.json()) as { users: TeamMember[] };
  return json.users;
}
