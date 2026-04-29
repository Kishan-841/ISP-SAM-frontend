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
};

export function getAccounts(filters: { kittyType?: 'BASE' | 'NEW' } = {}, opts: ApiOpts = {}) {
  const qs = filters.kittyType ? `?kittyType=${filters.kittyType}` : '';
  return apiGet<{ accounts: Account[] }>(`/accounts${qs}`, opts);
}

export function getAccount(id: string, opts: ApiOpts = {}) {
  return apiGet<{ account: Account }>(`/accounts/${id}`, opts);
}
