import { env } from '../lib/env';

export type ImportSummary = {
  imported: number;
  updated: number;
  skipped: number;
  errors: { rowNumber: number; reason: string }[];
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
