import { apiGet, type ApiOpts } from './api-client';

export type Account = {
  id: string;
  clientName: string;
  kittyType: 'BASE' | 'NEW';
  currentMrr: string;
  contractStatus: 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'PENDING';
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
  startOfPeriodMrr?: string | null;
};

export function getAccounts(filters: { kittyType?: 'BASE' | 'NEW' } = {}, opts: ApiOpts = {}) {
  const qs = filters.kittyType ? `?kittyType=${filters.kittyType}` : '';
  return apiGet<{ accounts: Account[] }>(`/accounts${qs}`, opts);
}

export function getAccount(id: string, opts: ApiOpts = {}) {
  return apiGet<{ account: Account }>(`/accounts/${id}`, opts);
}
