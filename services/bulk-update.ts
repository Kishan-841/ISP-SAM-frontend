import { env } from '../lib/env';

/** The only three fields the bulk update is allowed to touch. */
export type BulkUpdateField = 'circle' | 'city' | 'industryType';

export type FieldChange = {
  field: BulkUpdateField;
  from: string | null;
  to: string;
};

export type BulkUpdatePreview = {
  rowNumber: number;
  accountId: string;
  clientName: string;
  circuitId: string | null;
  changes: FieldChange[];
};

export type BulkUpdateErrorKind =
  | 'missing_field'
  | 'not_found'
  | 'ambiguous'
  | 'invalid_value'
  | 'other';

export type BulkUpdateError = {
  rowNumber: number;
  reason: string;
  kind: BulkUpdateErrorKind;
  clientName?: string | null;
  circuitId?: string | null;
};

export type BulkUpdateSummary = {
  updated: number;
  /** Matched a customer, but every value was already correct. */
  unchanged: number;
  skipped: number;
  updatedAccounts: BulkUpdatePreview[];
  errors: BulkUpdateError[];
};

/** Human label for a changed field, for the result table. */
export const FIELD_LABEL: Record<BulkUpdateField, string> = {
  circle: 'Zone',
  city: 'City',
  industryType: 'Industry',
};

/**
 * Enrich existing customers from a spreadsheet. Matches on circuit ID (or a
 * unique customer name) and can only update — it never creates a customer,
 * so an unknown row comes back as an error instead of a duplicate.
 */
export async function bulkUpdateAccounts(file: File): Promise<BulkUpdateSummary> {
  const base = typeof window === 'undefined' ? env.internalApiBase : env.apiBase;
  const form = new FormData();
  form.append('file', file);
  // Do NOT set Content-Type — fetch sets the multipart boundary itself.
  const res = await fetch(`${base}/accounts/bulk-update`, {
    method: 'POST',
    body: form,
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update failed (${res.status}): ${text}`);
  }
  return (await res.json()) as BulkUpdateSummary;
}
