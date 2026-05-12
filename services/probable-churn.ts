import { apiGet, apiPost, type ApiOpts } from './api-client';

export type ProbableChurnRow = {
  commercialChangeId: string;
  effectiveDate: string;
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
    contractStatus: 'PROBABLE_CHURN' | 'DISCONNECTING';
    currentArc: number;
    kittyType: 'BASE' | 'NEW';
  };
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
