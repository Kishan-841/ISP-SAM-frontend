import { env } from '../lib/env';

export type ImportedAccountPreview = {
  rowNumber: number;
  accountId: string;
  clientName: string;
  companyName: string | null;
  leadId: string | null;
  externalCrmId: string | null;
  email: string | null;
  currentArc: number;
  kittyType: 'BASE' | 'NEW';
  contractStatus: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'TERMINATED' | 'DISCONNECTING';
};

export type ImportErrorKind = 'missing_field' | 'invalid_value' | 'duplicate' | 'other';

export type ImportError = {
  rowNumber: number;
  reason: string;
  kind: ImportErrorKind;
  clientName?: string | null;
  leadId?: string | null;
};

export type ImportSummary = {
  imported: number;
  updated: number;
  skipped: number;
  createdAccounts: ImportedAccountPreview[];
  updatedAccounts: ImportedAccountPreview[];
  errors: ImportError[];
};

export async function importAccounts(file: File): Promise<ImportSummary> {
  const base = typeof window === 'undefined' ? env.internalApiBase : env.apiBase;
  const form = new FormData();
  form.append('file', file);
  // Do NOT set Content-Type — fetch sets the correct multipart boundary itself.
  const res = await fetch(`${base}/accounts/import`, {
    method: 'POST',
    body: form,
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Import failed (${res.status}): ${text}`);
  }
  return (await res.json()) as ImportSummary;
}
