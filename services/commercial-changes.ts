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
  clientApprovalAttached: boolean;
  approvalFileUrl: string | null;
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
  account: {
    id: string;
    clientName: string;
    customerCode: string | null;
    circuitId: string | null;
    kittyType: 'BASE' | 'NEW';
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
  reason?: string;
  notes?: string;
  // Disconnection-only.
  disconnectionCategoryId?: string;
  disconnectionSubCategoryId?: string;
  disconnectionReason?: string;
  approvalFile: File;
  poFile: File;
};

export type CommitResult = {
  commercialChange: {
    id: string;
    accountId: string;
    changeType: CommitInput['changeType'];
    oldArc: number;
    newArc: number;
    effectiveDate: string;
    approvalFileUrl: string;
    crmServiceOrderId: string | null;
    crmOrderNumber: string | null;
    crmStatus: string | null;
  };
  emailDraft: { subject: string; body: string };
  crm:
    | { ok: true; orderId: string; orderNumber: string; status: string }
    | { ok: false; error: string; status?: number }
    | { ok: 'disabled' };
};

export async function commitCommercialChange(input: CommitInput): Promise<CommitResult> {
  const base = typeof window === 'undefined' ? env.internalApiBase : env.apiBase;
  const form = new FormData();
  form.append('approvalFile', input.approvalFile);
  form.append('poFile', input.poFile);
  form.append('accountId', input.accountId);
  form.append('changeType', input.changeType);
  form.append('newArc', String(input.newArc));
  form.append('effectiveDate', input.effectiveDate);
  if (input.newBandwidthMbps != null) form.append('newBandwidthMbps', String(input.newBandwidthMbps));
  if (input.reason) form.append('reason', input.reason);
  if (input.notes) form.append('notes', input.notes);
  if (input.disconnectionCategoryId)
    form.append('disconnectionCategoryId', input.disconnectionCategoryId);
  if (input.disconnectionSubCategoryId)
    form.append('disconnectionSubCategoryId', input.disconnectionSubCategoryId);
  if (input.disconnectionReason)
    form.append('disconnectionReason', input.disconnectionReason);

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
