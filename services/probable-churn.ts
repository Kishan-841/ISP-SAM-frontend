import { apiGet, apiPost, type ApiOpts } from './api-client';

export type ProbableChurnRow = {
  commercialChangeId: string;
  effectiveDate: string;
  /** When the commercial-change row was created (raised). */
  raisedAt: string;
  retentionPromptDueAt: string | null;
  retentionDecision: 'RETAIN' | 'PROCEED' | null;
  retentionDecidedAt: string | null;
  scheduledTerminationAt: string | null;
  /** Days until the day-21 prompt is due. Negative = overdue. */
  daysUntilPrompt: number | null;
  /** Days until the lazy-sweep terminates the account. Negative = sweep pending. */
  daysUntilTermination: number | null;
  disconnectionReason: string | null;
  customer: {
    id: string;
    clientName: string;
    companyName: string | null;
    customerCode: string | null;
  };
  samOwner: { id: string; name: string; email: string } | null;
  account: {
    id: string;
    contractStatus: 'PROBABLE_CHURN' | 'DISCONNECTING' | 'PENDING_QUICK_APPROVAL';
    currentArc: number;
    kittyType: 'BASE' | 'NEW';
    /** null = Excel-imported. UI hides the "sent to CRM on Proceed" hint. */
    externalCrmId: string | null;
  };
  /** 'NORMAL' or 'QUICK' (NULL on legacy rows). */
  disconnectionMode: 'NORMAL' | 'QUICK' | null;
  /** When mode='QUICK': 1..15 days from CRM-Admin approval to termination. */
  quickRequestedDays: number | null;
  /** When mode='QUICK': SAM's justification, shown verbatim. */
  quickApprovalReason: string | null;
  /** CRM hand-off — populated after PROCEED on a CRM-synced customer. */
  crmServiceOrderId: string | null;
  crmOrderNumber: string | null;
  crmStatus: string | null;
  crmStatusUpdatedAt: string | null;
};

export type ProbableChurnResponse = {
  rows: ProbableChurnRow[];
  summary: { count: number; atRiskArc: number };
};

export function getProbableChurn(opts: ApiOpts = {}) {
  return apiGet<ProbableChurnResponse>('/probable-churn', opts);
}

export function decideRetention(
  commercialChangeId: string,
  decision: 'RETAIN' | 'PROCEED',
  opts: ApiOpts = {},
) {
  return apiPost<{ change: { id: string; retentionDecision: 'RETAIN' | 'PROCEED' } }>(
    `/commercial-changes/${commercialChangeId}/retention-decision`,
    { decision },
    opts,
  );
}
