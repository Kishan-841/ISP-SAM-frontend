import { apiGet, type ApiOpts } from './api-client';

export type CommercialChangeType =
  | 'UPGRADE'
  | 'DOWNGRADE'
  | 'RATE_REVISION'
  | 'DISCONNECTION';

export type ChurnStatus = 'under_budget' | 'over_budget';

export type SamRow = {
  userId: string;
  name: string;
  email: string;
  customerCount: number;
  totalArc: number;
  startOfPeriodArc: number;
  arcDelta: number;
  arcDeltaPercent: number;
  changes: Record<CommercialChangeType, { count: number; arcImpact: number }>;
  totalChanges: number;
  meetingsHeld: number;
  momsSent: number;
  momSlaPercent: number;
  approvalPercent: number;
  activationPending: number;
  customersWithoutMeeting: number;
  reliabilityScore: number;
  /** Net ARC churn = disconnections + downgrades − upgrades (positive = loss). */
  netChurnArc: number;
  netChurnPercent: number;
  /** Per-SAM allowable churn ceiling (range 6.00–8.00). */
  allowableChurnPercent: number;
  /** allowableChurnPercent − netChurnPercent. Positive = under budget = incentive-eligible. */
  churnHeadroomPercent: number;
  churnStatus: ChurnStatus;
};

export type TeamPerformance = {
  team: {
    headId: string;
    samCount: number;
    customerCount: number;
    unassignedCount: number;
    totalArc: number;
    startOfPeriodArc: number;
    arcDelta: number;
    totalChanges: number;
    momsPending: number;
    momsSent: number;
    meetingsHeld: number;
    activationPending: number;
    customersWithoutMeeting30d: number;
    netChurnArc: number;
    netChurnPercent: number;
    /** ARC-weighted allowable churn across the team. */
    allowableChurnPercent: number;
    churnHeadroomPercent: number;
    samsOverBudget: number;
  };
  sams: SamRow[];
};

export function getTeamPerformance(opts: ApiOpts = {}) {
  return apiGet<TeamPerformance>('/dashboard/team-performance', opts);
}
