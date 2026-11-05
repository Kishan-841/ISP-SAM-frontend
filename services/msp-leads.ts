import { apiGet, apiPost, type ApiOpts } from './api-client';

/**
 * MSP leads — managed-services opportunities (firewalls, managed networking)
 * a SAM hands to the MSP CRM. A different product from the ISP CRM behind
 * `services/leads.ts`: there the SAM picks the BDM, here the MSP team lead
 * assigns it and the status reaches us through a five-minute sweep.
 */
export type MspLeadRow = {
  id: string;
  /** Our lead id as MSP knows it. */
  externalRef: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  requirement: string | null;
  notes: string | null;

  // Tax details — all optional. MSP validates the GSTIN and derives the state
  // from it; an unusable one is kept in their lead's notes, not rejected.
  customerGstin: string | null;
  customerState: string | null;
  billingAddress: string | null;

  /** 'HARDWARE' | 'SOFTWARE'. With at least one subcategory the lead arrives
   *  on MSP already categorized, so their team lead only has to assign it. */
  classification: string | null;
  /** MSP's product names, e.g. ["Firewall", "Switches"]. */
  subcategories: string[];

  /** SENT — MSP has it. PENDING — queued, the sweep retries. REJECTED — MSP
   *  refused the data; `sendError` carries their wording. */
  sendStatus: 'SENT' | 'PENDING' | 'REJECTED';
  sendError: string | null;
  sendAttempts: number;
  lastAttemptAt: string | null;

  mspLeadId: string | null;
  /** RECEIVED | ASSIGNED | IN_DISCUSSION | … — free text on purpose: MSP may
   *  add statuses, and an unknown one still renders via `mspStatusLabel`. */
  mspStatus: string | null;
  mspStatusLabel: string | null;
  /** The MSP Sales person, once their team lead has assigned it. */
  mspAssignedTo: string | null;
  mspOrderNo: number | null;
  mspDropReason: string | null;
  mspRemovedAt: string | null;
  mspSyncedAt: string | null;

  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; email: string };
};

export type MspLeadFormPayload = {
  companyName: string;
  contactPerson: string;
  phone: string;
  /** Required — MSP refuses a lead without one. */
  email: string;
  requirement?: string;
  notes?: string;
  customerGstin?: string;
  customerState?: string;
  billingAddress?: string;
  classification?: 'HARDWARE' | 'SOFTWARE';
  subcategories?: string[];
};

export type MspLeadSendResult = {
  /** SENT (201) · QUEUED (202, couldn't reach MSP, will retry) — a rejection
   *  comes back as a thrown error carrying MSP's own message. */
  status: 'SENT' | 'QUEUED';
  dispatchId: string;
  externalRef: string;
  mspLeadId: string | null;
  mspStatus: string | null;
  mspStatusLabel: string | null;
  detail: string | null;
};

export function createMspLead(payload: MspLeadFormPayload, opts: ApiOpts = {}) {
  return apiPost<MspLeadSendResult>('/leads/msp', payload, opts);
}

export function listMspLeads(opts: ApiOpts = {}, limit = 50) {
  const qs = limit !== 50 ? `?limit=${limit}` : '';
  return apiGet<{
    rows: MspLeadRow[];
    /** MSP's clock at the last good sweep, or null before the first one. */
    lastSyncedAt: string | null;
  }>(`/leads/msp${qs}`, opts);
}

/** "Refresh status" — the sweep runs every five minutes; this is the nudge. */
export function syncMspLeads(opts: ApiOpts = {}) {
  return apiPost<{
    retried: number;
    updated: number;
    removed: number;
    serverTime: string | null;
  }>('/leads/msp/sync', {}, opts);
}
