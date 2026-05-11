import { apiGet, type ApiOpts } from './api-client';

export type CommercialChangeType =
  | 'UPGRADE'
  | 'DOWNGRADE'
  | 'RATE_REVISION'
  | 'DISCONNECTION';

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
  };
  sams: SamRow[];
};

export function getTeamPerformance(opts: ApiOpts = {}) {
  return apiGet<TeamPerformance>('/dashboard/team-performance', opts);
}
