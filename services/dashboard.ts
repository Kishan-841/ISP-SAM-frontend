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
  /**
   * CRM-in-flight reconciliation. `netArcLakh` is the adjustment needed to
   * make the waterfall sum match the live Current ARC card. Non-zero when
   * upgrades/downgrades have been committed but CRM hasn't yet marked them
   * COMPLETED — see CLAUDE.md convention #3.
   */
  pending: { count: number; netArcLakh: number };
  /**
   * Existing-base commercial changes still walking the internal approval
   * chain. Excluded from the buckets / Current ARC until approved.
   * `netArcLakh` is the net ARC that will land once all are approved.
   *
   * Optional so the dashboard degrades gracefully during a deploy where the
   * frontend is live but the backend hasn't shipped this field yet.
   */
  pendingApproval?: {
    count: number;
    netArcLakh: number;
    awaitingSuperAdmin2: number;
    awaitingSamHead: number;
    awaitingAccounts: number;
  };
  probableChurn: { count: number; arcAtRiskLakh: number };
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
  /** See ExistingBaseMetrics.pending. */
  pending:       { count: number; netArcLakh: number };
  probableChurn: { count: number; arcAtRiskLakh: number };
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

export type Bucket = 'UPGRADE' | 'DOWNGRADE' | 'RATE_REVISION' | 'DISCONNECTION';
export type KittyType = 'BASE' | 'NEW';

export type BucketChangeRow = {
  id: string;
  effectiveDate: string;
  mailReceivedDate: string | null;
  customer: {
    id: string;
    clientName: string;
    companyName: string | null;
    customerCode: string | null;
    circuitId: string | null;
    kittyType: KittyType;
    /** null = Excel-imported. UI hides CRM-only cells. */
    externalCrmId: string | null;
  };
  samOwner: { id: string; name: string; email: string } | null;
  changeType: Bucket;
  oldArc: number;
  newArc: number;
  deltaArc: number;
  oldBandwidthMbps: number | null;
  newBandwidthMbps: number | null;
  reason: string | null;
  disconnectionReason: string | null;
  approvalFileUrl: string | null;
  poFileUrl: string | null;
  crmStatus: string | null;
};

export function getBucketChanges(
  filters: { kittyType: KittyType; bucket: Bucket; quarter?: FyQuarter },
  opts: ApiOpts = {},
) {
  const qs = new URLSearchParams({
    kittyType: filters.kittyType,
    bucket: filters.bucket,
  });
  if (filters.quarter) qs.set('quarter', filters.quarter);
  return apiGet<{ changes: BucketChangeRow[] }>(`/dashboard/changes?${qs}`, opts);
}
