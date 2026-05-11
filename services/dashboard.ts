import { apiGet, type ApiOpts } from './api-client';

export type ExistingBaseMetrics = {
  totalCustomers: number;
  totalBaseArcLakh: number;
  currentCustomers: number;
  currentArcLakh: number;
  terminatedCount: number;
  upgrades: { count: number; arcAddedLakh: number };
  downgrades: { count: number; arcReducedLakh: number };
  rateRevisions: { count: number; arcChangeLakh: number };
  terminations: { count: number; arcLostLakh: number };
};

export type NewBaseMetrics = {
  // Components — mirrors ExistingBaseMetrics shape.
  totalCustomers: number;
  totalNewArcLakh: number;
  currentCustomers: number;
  currentArcLakh: number;
  terminatedCount: number;
  // Commercial-change breakdown across NEW kitty (all-time).
  upgrades:      { count: number; arcAddedLakh: number };
  downgrades:    { count: number; arcReducedLakh: number };
  rateRevisions: { count: number; arcChangeLakh: number };
  terminations:  { count: number; arcLostLakh: number };
  addedThisMonth:   { count: number; arcLakh: number };
  addedThisQuarter: { count: number; arcLakh: number };
  addedThisFy:      { count: number; arcLakh: number };
  avgTimeToFirstMomDays: number | null;
  customersWithoutMeeting: number;
  earlyUpgrades: { count: number; arcAddedLakh: number };
  immediateRateRevisions: number;
  earlyDowngrades: number;
  recentAdditions: Array<{
    id: string;
    clientName: string;
    companyName: string | null;
    customerCode: string | null;
    onboardingDate: string;
    currentArcLakh: number;
    contractStatus: string;
  }>;
};

export type FyQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export function getExistingBaseMetrics(
  filters: { quarter?: FyQuarter } = {},
  opts: ApiOpts = {},
) {
  const qs = filters.quarter ? `?quarter=${filters.quarter}` : '';
  return apiGet<ExistingBaseMetrics>(`/dashboard/existing-base${qs}`, opts);
}

export function getNewBaseMetrics(opts: ApiOpts = {}) {
  return apiGet<NewBaseMetrics>('/dashboard/new-base', opts);
}
