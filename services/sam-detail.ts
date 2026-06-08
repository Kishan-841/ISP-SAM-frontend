import { apiGet, type ApiOpts } from './api-client';

export type FyQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';
type ChangeType = 'UPGRADE' | 'DOWNGRADE' | 'RATE_REVISION' | 'DISCONNECTION';

type CustomerLite = {
  id: string;
  clientName: string;
  companyName: string | null;
};

export type SamDetail = {
  sam: {
    id: string;
    name: string;
    email: string;
    samHeadId: string | null;
    samHeadName: string | null;
  };
  quarter: FyQuarter | null;
  score: {
    total: number;
    components: {
      revenue: { weight: number; raw: number; weighted: number };
      mom: { weight: number; raw: number; weighted: number };
      compliance: { weight: number; raw: number; weighted: number };
      onboarding: { weight: number; raw: number; weighted: number };
    };
  };
  kpis: {
    customers: { value: number; teamAvg: number; withoutMeeting: number };
    arcManaged: {
      value: number;
      teamAvg: number;
      arcDelta: number;
      arcDeltaPercent: number;
    };
    commercialChanges: { value: number; teamAvg: number; activationPending: number };
    meetings: { value: number; teamAvg: number; upcomingCount: number };
    momSla: { value: number; teamAvg: number; momsOverdue: number };
  };
  changes: Record<ChangeType, { count: number; arcImpact: number }>;
  upcomingMeetings: Array<{
    id: string;
    scheduledAt: string;
    customer: CustomerLite;
  }>;
  recentMeetings: Array<{
    id: string;
    scheduledAt: string;
    heldAt: string | null;
    momSentAt: string | null;
    momOverdue: boolean;
    customer: CustomerLite;
  }>;
  activityTimeline: Array<{
    type:
      | 'CHANGE_COMMITTED'
      | 'CHANGE_RETAINED'
      | 'CHANGE_PROCEEDED'
      | 'MEETING_HELD'
      | 'MOM_SENT'
      | 'CUSTOMER_ASSIGNED';
    timestamp: string;
    summary: string;
    customer: CustomerLite | null;
  }>;
  riskPulse: {
    probableChurnCount: number;
    probableChurnArc: number;
    customersWithoutMeeting: number;
    staleMoms: number;
    day21Prompts: number;
  };
  churn: {
    netChurnArc: number;
    netChurnPercent: number;
    allowableChurnPercent: number;
    churnHeadroomPercent: number;
    churnStatus: 'under_budget' | 'over_budget';
  };
};

export function getSamDetail(
  samId: string,
  filters: { quarter?: FyQuarter } = {},
  opts: ApiOpts = {},
) {
  const qs = filters.quarter ? `?quarter=${filters.quarter}` : '';
  return apiGet<SamDetail>(`/dashboard/team-performance/${samId}${qs}`, opts);
}
