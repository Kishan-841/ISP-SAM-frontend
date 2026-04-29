import { apiGet } from './api-client';

export type Account = {
  id: string;
  clientName: string;
  kittyType: 'BASE' | 'NEW';
  currentMrr: string; // Prisma Decimal serialises as string
  contractStatus: 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'PENDING';
  lastMomDate: string | null;
  lastMeetingDate: string | null;
  onboardingDate: string;
  externalCrmId: string | null;
};

export function getAccounts(filters: { kittyType?: 'BASE' | 'NEW' } = {}) {
  const qs = filters.kittyType ? `?kittyType=${filters.kittyType}` : '';
  return apiGet<{ accounts: Account[] }>(`/accounts${qs}`);
}

export function getAccount(id: string) {
  return apiGet<{ account: Account }>(`/accounts/${id}`);
}
