import { apiGet, apiPost, type ApiOpts } from './api-client';

export type BdmType = 'TEAM_LEADER' | 'SOLO_BDM';

export type BdmAssignable = {
  id: string;
  name: string;
  /** Optional per the contract — render `${name} · ${email}` when present,
   *  fall back to `${name}` alone otherwise. */
  email?: string | null;
  type: BdmType;
};

export type LeadFormPayload = {
  companyName: string;
  contactName: string;
  phone: string;
  email?: string;
  designation?: string;
  industry?: string;
  city?: string;
  notes?: string;
  assignedToUserId: string;
};

export type LeadDispatchResult = {
  status: 'SENT' | 'DEDUPED';
  dispatchId: string;
  samLeadId: string;
  crmLeadId: string;
  crmLeadNumber: string;
  assignedToName: string;
};

export function listBdms(opts: ApiOpts = {}) {
  return apiGet<{ bdms: BdmAssignable[] }>('/leads/bdms', opts);
}

export function createLead(payload: LeadFormPayload, opts: ApiOpts = {}) {
  return apiPost<LeadDispatchResult>('/leads', payload, opts);
}

export type LeadDispatchRow = {
  id: string;
  samLeadId: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string | null;
  designation: string | null;
  industry: string | null;
  city: string | null;
  notes: string | null;
  assignedToUserId: string;
  assignedToName: string;
  assignedToType: BdmType;
  crmLeadId: string | null;
  crmLeadNumber: string | null;
  status: 'SENT' | 'DEDUPED' | 'FAILED';
  errorReason: string | null;
  createdAt: string;
  createdBy: { id: string; name: string; email: string };
};

export function listDispatches(opts: ApiOpts = {}, limit = 50) {
  const qs = limit !== 50 ? `?limit=${limit}` : '';
  return apiGet<{ dispatches: LeadDispatchRow[] }>(`/leads/dispatches${qs}`, opts);
}

/** Enriched view for the My Leads page — dispatch rows joined with CRM
 *  current owner + stage. `liveStatus` is null when CRM endpoint is
 *  unreachable; UI shows a degraded banner. */
export type EnrichedLeadRow = {
  dispatchId: string;
  samLeadId: string;
  crmLeadId: string | null;
  crmLeadNumber: string | null;
  companyName: string;
  contactName: string;
  phone: string;
  email: string | null;
  designation: string | null;
  industry: string | null;
  city: string | null;
  notes: string | null;
  dispatchStatus: 'SENT' | 'DEDUPED' | 'FAILED';
  dispatchErrorReason: string | null;
  originalAssignedTo: { id: string; name: string; type: BdmType };
  currentOwner: { id: string; name: string; email?: string | null; type: BdmType };
  liveStatus: string | null;
  lastUpdatedAt: string;
  createdAt: string;
  createdBy: { id: string; name: string; email: string };
};

export function listMyLeads(opts: ApiOpts = {}, limit = 50) {
  const qs = limit !== 50 ? `?limit=${limit}` : '';
  return apiGet<{
    rows: EnrichedLeadRow[];
    liveDataAvailable: boolean;
    liveDataError?: string;
  }>(`/leads/my${qs}`, opts);
}
