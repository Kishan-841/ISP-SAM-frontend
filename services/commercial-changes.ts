import { env } from '../lib/env';

export type CommitInput = {
  accountId: string;
  changeType: 'UPGRADE' | 'DOWNGRADE' | 'RATE_REVISION' | 'TERMINATION';
  newMrr: number;
  newBandwidthMbps?: number;
  effectiveDate: string; // YYYY-MM-DD
  reason?: string;
  file: File;
};

export type CommitResult = {
  commercialChange: {
    id: string;
    accountId: string;
    changeType: CommitInput['changeType'];
    oldMrr: number;
    newMrr: number;
    effectiveDate: string;
    approvalFileUrl: string;
  };
  emailDraft: { subject: string; body: string };
};

export async function commitCommercialChange(input: CommitInput): Promise<CommitResult> {
  const base = typeof window === 'undefined' ? env.internalApiBase : env.apiBase;
  const form = new FormData();
  form.append('file', input.file);
  form.append('accountId', input.accountId);
  form.append('changeType', input.changeType);
  form.append('newMrr', String(input.newMrr));
  form.append('effectiveDate', input.effectiveDate);
  if (input.newBandwidthMbps != null) form.append('newBandwidthMbps', String(input.newBandwidthMbps));
  if (input.reason) form.append('reason', input.reason);

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
