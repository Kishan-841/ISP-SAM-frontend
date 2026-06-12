import { env } from '../lib/env';

export type BulkImportErrorKind =
  | 'missing_field'
  | 'invalid_value'
  | 'unknown_circuit'
  | 'inconsistent_arc'
  | 'invalid_disconnection_reason'
  | 'account_terminated'
  | 'other';

export type BulkImportError = {
  rowNumber: number;
  reason: string;
  kind: BulkImportErrorKind;
  circuitId?: string | null;
  changeType?: string | null;
};

export type BulkImportedRowPreview = {
  rowNumber: number;
  circuitId: string;
  clientName: string;
  changeType: 'UPGRADE' | 'DOWNGRADE' | 'RATE_REVISION' | 'DISCONNECTION';
  oldArc: number;
  newArc: number;
  effectiveDate: string;
};

export type BulkImportSummary = {
  imported: number;
  skipped: number;
  appliedChanges: BulkImportedRowPreview[];
  errors: BulkImportError[];
};

export async function bulkImportCommercialChanges(file: File): Promise<BulkImportSummary> {
  const base = typeof window === 'undefined' ? env.internalApiBase : env.apiBase;
  const form = new FormData();
  form.append('file', file);
  // Do NOT set Content-Type — fetch sets the correct multipart boundary itself.
  const res = await fetch(`${base}/commercial-changes/bulk-import`, {
    method: 'POST',
    body: form,
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
    throw new Error(detail || `Bulk import failed (${res.status})`);
  }
  return (await res.json()) as BulkImportSummary;
}
