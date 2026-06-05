import { env } from '../lib/env';
import { apiGet, type ApiOpts } from './api-client';

export type ChangeType = 'UPGRADE' | 'DOWNGRADE' | 'RATE_REVISION' | 'DISCONNECTION';

export type CommercialChangeListItem = {
  id: string;
  accountId: string;
  changeType: ChangeType;
  /** Annual ₹ — Decimal serialised as a string. */
  oldArc: string;
  newArc: string;
  effectiveDate: string;
  mailReceivedDate: string | null;
  clientApprovalAttached: boolean;
  approvalFileUrl: string | null;
  poFileUrl: string | null;
  reason: string | null;
  oldBandwidthMbps: number | null;
  newBandwidthMbps: number | null;
  createdAt: string;
  // CRM service-order linkage (set when SAM forwards the change to CRM).
  crmServiceOrderId: string | null;
  crmOrderNumber: string | null;
  crmStatus: string | null;
  crmStatusUpdatedAt: string | null;
  activationDate: string | null;
  disconnectionCategoryId: string | null;
  disconnectionSubCategoryId: string | null;
  disconnectionReason: string | null;
  /** 'NORMAL' or 'QUICK' (NULL on non-disconnection rows / legacy rows). */
  disconnectionMode: 'NORMAL' | 'QUICK' | null;
  /** When mode='QUICK': 1..15 days to termination after CRM approval. */
  quickRequestedDays: number | null;
  quickApprovalReason: string | null;
  quickApprovalDecision: 'APPROVED' | 'REJECTED' | null;
  account: {
    id: string;
    clientName: string;
    customerCode: string | null;
    circuitId: string | null;
    kittyType: 'BASE' | 'NEW';
    /** null = Excel-imported (no CRM bridge). UI hides CRM-only cells. */
    externalCrmId: string | null;
  };
};

export type DisconnectionCategory = {
  id: string;
  name: string;
  isActive: boolean;
  subCategories: { id: string; name: string; isActive: boolean }[];
};

export function getDisconnectionReasons(opts: ApiOpts = {}) {
  return apiGet<{ reasons: DisconnectionCategory[] }>(
    '/commercial-changes/disconnection-reasons',
    opts,
  );
}

export function getCommercialChanges(
  filters: { type?: 'UPGRADE' | 'DOWNGRADE' | 'RATE_REVISION' | 'DISCONNECTION' } = {},
  opts: ApiOpts = {},
) {
  const qs = filters.type ? `?type=${filters.type}` : '';
  return apiGet<{ changes: CommercialChangeListItem[] }>(`/commercial-changes${qs}`, opts);
}

export type CommitInput = {
  accountId: string;
  changeType: ChangeType;
  /** Annual ₹. */
  newArc: number;
  newBandwidthMbps?: number;
  effectiveDate: string; // YYYY-MM-DD
  mailReceivedDate?: string; // YYYY-MM-DD — date SAM received the customer's approval email
  reason?: string;
  notes?: string;
  // Disconnection-only.
  disconnectionCategoryId?: string;
  disconnectionSubCategoryId?: string;
  disconnectionReason?: string;
  /** 'NORMAL' (default — 21-day retention flow) or 'QUICK' (skip retention,
   *  needs CRM Admin approval, terminates in `quickRequestedDays` days). */
  disconnectionMode?: 'NORMAL' | 'QUICK';
  /** Required when disconnectionMode='QUICK'. 1..15 days. */
  quickRequestedDays?: number;
  /** Required when disconnectionMode='QUICK'. Min 10 chars — surfaces to CRM Admin. */
  quickApprovalReason?: string;
  /** At least one of these is required (validated server-side). */
  approvalFile?: File | null;
  poFile?: File | null;
  /** When true the doc requirement is skipped — backend ALSO requires the
   *  SAM_TEST_MODE env flag to permit it. Stamps testMode:true in audit log. */
  testMode?: boolean;
};

export type CommitResult = {
  commercialChange: {
    id: string;
    accountId: string;
    changeType: CommitInput['changeType'];
    oldArc: number;
    newArc: number;
    effectiveDate: string;
    approvalFileUrl: string | null;
    poFileUrl: string | null;
    crmServiceOrderId: string | null;
    crmOrderNumber: string | null;
    crmStatus: string | null;
  };
  emailDraft: { subject: string; body: string };
  crm:
    | { ok: true; orderId: string; orderNumber: string; status: string }
    | { ok: false; error: string; status?: number }
    | { ok: 'disabled' }
    | { ok: 'local-only' }
    | { ok: 'probable-churn' }
    | { ok: 'pending-quick-approval' };
};

export async function commitCommercialChange(input: CommitInput): Promise<CommitResult> {
  const base = typeof window === 'undefined' ? env.internalApiBase : env.apiBase;
  const form = new FormData();
  // Only append the file fields that are actually present. multer.fields()
  // is happy with a missing field; appending null/undefined would corrupt
  // the multipart body.
  if (input.approvalFile) form.append('approvalFile', input.approvalFile);
  if (input.poFile) form.append('poFile', input.poFile);
  form.append('accountId', input.accountId);
  form.append('changeType', input.changeType);
  form.append('newArc', String(input.newArc));
  form.append('effectiveDate', input.effectiveDate);
  if (input.mailReceivedDate) form.append('mailReceivedDate', input.mailReceivedDate);
  if (input.testMode) form.append('testMode', 'true');
  if (input.newBandwidthMbps != null) form.append('newBandwidthMbps', String(input.newBandwidthMbps));
  if (input.reason) form.append('reason', input.reason);
  if (input.notes) form.append('notes', input.notes);
  if (input.disconnectionCategoryId)
    form.append('disconnectionCategoryId', input.disconnectionCategoryId);
  if (input.disconnectionSubCategoryId)
    form.append('disconnectionSubCategoryId', input.disconnectionSubCategoryId);
  if (input.disconnectionReason)
    form.append('disconnectionReason', input.disconnectionReason);
  if (input.disconnectionMode) form.append('disconnectionMode', input.disconnectionMode);
  if (input.quickRequestedDays != null)
    form.append('quickRequestedDays', String(input.quickRequestedDays));
  if (input.quickApprovalReason)
    form.append('quickApprovalReason', input.quickApprovalReason);

  const res = await fetch(`${base}/commercial-changes`, {
    method: 'POST',
    body: form,
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Commit failed (${res.status}): ${text}`);
  }
  return (await res.json()) as CommitResult;
}

/**
 * Admin-only backfill for a disconnection that already happened (the
 * imported customer was wrongly marked Active; we now know they
 * disconnected on, say, 14-Apr). No CRM round-trip, no documents,
 * no approval queue — purely local bookkeeping so the waterfall on
 * /existing-base counts the termination in the correct month.
 */
export type BackfillDisconnectionInput = {
  accountId: string;
  /** Last billing date (ISO YYYY-MM-DD). */
  effectiveDate: string;
  reason: string;
};

export type BackfillDisconnectionResult = {
  commercialChange: {
    id: string;
    accountId: string;
    effectiveDate: string;
    oldArc: number;
  };
  account: {
    id: string;
    clientName: string;
    contractStatus: string;
  };
};

export async function backfillDisconnection(
  input: BackfillDisconnectionInput,
): Promise<BackfillDisconnectionResult> {
  const base = typeof window === 'undefined' ? env.internalApiBase : env.apiBase;
  const res = await fetch(`${base}/commercial-changes/backfill-disconnection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });
  if (!res.ok) {
    let detail = '';
    try {
      const body = (await res.json()) as { error?: string };
      detail = body.error ?? '';
    } catch {
      detail = await res.text();
    }
    throw new Error(detail || `Backfill failed (${res.status})`);
  }
  return (await res.json()) as BackfillDisconnectionResult;
}

/**
 * Pending QUICK-disconnect requests for BASE-kitty customers that need
 * a SAM-admin decision. NEW-kitty rows route to the CRM admin queue
 * and aren't returned here.
 */
export type PendingQuickApproval = {
  id: string;
  accountId: string;
  oldArc: number;
  quickRequestedDays: number | null;
  quickApprovalReason: string | null;
  disconnectionReason: string | null;
  effectiveDate: string;
  requestedAt: string;
  account: {
    id: string;
    clientName: string;
    companyName: string | null;
    customerCode: string | null;
    circuitId: string | null;
    kittyType: 'BASE' | 'NEW';
    currentArc: number;
    contractStatus: string;
    samOwner: { id: string; name: string; email: string } | null;
  };
};

export function getPendingQuickApprovals(opts: ApiOpts = {}) {
  return apiGet<{ items: PendingQuickApproval[]; total: number }>(
    '/commercial-changes/quick-approvals',
    opts,
  );
}

export async function samQuickDecision(
  commercialChangeId: string,
  decision: 'APPROVE' | 'REJECT',
  note?: string,
): Promise<{ change: { id: string; quickApprovalDecision: string } }> {
  const base = typeof window === 'undefined' ? env.internalApiBase : env.apiBase;
  const res = await fetch(
    `${base}/commercial-changes/${commercialChangeId}/sam-quick-decision`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, note }),
      cache: 'no-store',
    },
  );
  if (!res.ok) {
    let detail = '';
    try {
      const body = (await res.json()) as { error?: string };
      detail = body.error ?? '';
    } catch {
      detail = await res.text();
    }
    throw new Error(detail || `Decision failed (${res.status})`);
  }
  return (await res.json()) as { change: { id: string; quickApprovalDecision: string } };
}

export async function refreshCrmStatus(id: string): Promise<{ change: CommercialChangeListItem }> {
  const base = typeof window === 'undefined' ? env.internalApiBase : env.apiBase;
  const res = await fetch(`${base}/commercial-changes/${id}/refresh-status`, {
    method: 'POST',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Refresh failed (${res.status}): ${await res.text()}`);
  return (await res.json()) as { change: CommercialChangeListItem };
}

export async function setActivationDate(
  id: string,
  activationDate: string,
): Promise<{ change: CommercialChangeListItem }> {
  const base = typeof window === 'undefined' ? env.internalApiBase : env.apiBase;
  const res = await fetch(`${base}/commercial-changes/${id}/set-activation-date`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activationDate }),
    cache: 'no-store',
  });
  if (!res.ok)
    throw new Error(`Set activation date failed (${res.status}): ${await res.text()}`);
  return (await res.json()) as { change: CommercialChangeListItem };
}
