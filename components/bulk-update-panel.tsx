'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  Equal,
  MapPin,
  XCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FormSection } from './form-section';
import { FileDropZone } from './file-drop-zone';
import { StatusPill, type PillTone } from './status-pill';
import {
  bulkUpdateAccounts,
  FIELD_LABEL,
  type BulkUpdateError,
  type BulkUpdateErrorKind,
  type BulkUpdatePreview,
  type BulkUpdateSummary,
} from '../services/bulk-update';

const PREVIEW_LIMIT = 50;
const ERROR_LIMIT = 50;

/**
 * "Update zone, city & industry" mode of the Excel Import page.
 *
 * Kept distinct from the create/update importer next to it because the two
 * behave very differently on a row that matches nothing: the importer adds a
 * customer, this one refuses. Operators need that difference to be obvious
 * before they pick a file, so it's stated on the form, not just in the result.
 */
export function BulkUpdatePanel() {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkUpdateSummary | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const summary = await bulkUpdateAccounts(file);
      setResult(summary);
      setFileName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
    setFileName(null);
  }

  if (result) {
    return <ResultPanel result={result} fileName={fileName} onReset={reset} />;
  }

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardContent className="px-6 pt-6 pb-0 divide-y divide-gray-100">
          <FormSection
            title="Upload"
            description="Fills in Zone, City and Industry on customers SAM already has. Nothing else on the customer is touched, and no new customer is ever created."
          >
            <div className="sm:col-span-2 flex flex-col gap-3">
              <ColumnGuide />
              <FileDropZone
                accept=".xlsx,.xls,.csv"
                file={file}
                onFileChange={(f) => {
                  setFile(f);
                  setError(null);
                }}
                helper=".xlsx, .xls, or .csv · up to 10 MB"
                disabled={submitting}
              />
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Upload failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </FormSection>
        </CardContent>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-xl">
          <Button
            type="submit"
            disabled={!file || submitting}
            size="lg"
            className="bg-brand-600 text-white hover:bg-brand-700"
          >
            {submitting ? 'Updating…' : 'Update customers'}
          </Button>
        </div>
      </Card>
    </form>
  );
}

// ─── Column guide ─────────────────────────────────────────────────────

const COLUMNS: Array<{ field: string; spellings: string[]; note: string }> = [
  {
    field: 'Circuit ID',
    spellings: ['Circuit ID', 'Circuit', 'Circuit No'],
    note: 'How a row is matched to a customer. Case and spaces are ignored.',
  },
  {
    field: 'Customer Name',
    spellings: ['Customer Name', 'Client', 'Name'],
    note: 'Fallback when there is no Circuit ID — only used when exactly one customer has that name.',
  },
  { field: 'Zone', spellings: ['Zone', 'Circle', 'Region', 'Area'], note: 'Written to the zone used by Zones & Cities.' },
  { field: 'City', spellings: ['City', 'Town'], note: 'The city within that zone.' },
  { field: 'Industry', spellings: ['Industry', 'Industry Type', 'Sector', 'Vertical'], note: 'Free text — matching labels are grouped together.' },
];

function ColumnGuide() {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <p className="text-sm font-medium text-gray-900">Columns</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Header spelling is matched loosely — case, spaces and underscores don&apos;t matter.
          Leave a cell blank to keep the existing value.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-40">Column</TableHead>
            <TableHead className="w-72">Spellings accepted</TableHead>
            <TableHead>What it does</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {COLUMNS.map((c) => (
            <TableRow key={c.field}>
              <TableCell className="font-medium text-gray-900 align-top py-2">{c.field}</TableCell>
              <TableCell className="py-2">
                <div className="flex flex-wrap gap-1.5">
                  {c.spellings.map((s) => (
                    <span
                      key={s}
                      className="inline-block px-2 py-0.5 rounded text-[12px] bg-gray-100 text-gray-700 font-mono"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-gray-600 text-xs py-2 whitespace-normal">{c.note}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Result ───────────────────────────────────────────────────────────

function ResultPanel({
  result,
  fileName,
  onReset,
}: {
  result: BulkUpdateSummary;
  fileName: string | null;
  onReset: () => void;
}) {
  const total = result.updated + result.unchanged + result.skipped;
  const anyUpdated = result.updatedAccounts.length > 0;
  const anyErrors = result.errors.length > 0;
  const tone = result.updated === 0 ? (anyErrors ? 'red' : 'amber') : anyErrors ? 'amber' : 'emerald';

  const headline =
    result.updated === 0 && anyErrors
      ? 'Nothing was updated'
      : result.updated === 0
        ? 'Every row already had these values'
        : anyErrors
          ? `Partly applied — ${result.updated} of ${total} rows updated`
          : `Updated ${result.updated} customer${result.updated === 1 ? '' : 's'}`;

  const detail =
    result.updated === 0 && anyErrors
      ? `No row in ${fileName ?? 'your file'} could be matched to a customer. Check the Circuit ID column against the customers page.`
      : result.unchanged > 0 && result.updated === 0
        ? 'Every row matched a customer whose zone, city and industry were already correct. Nothing needed changing.'
        : `${result.updated} customer${result.updated === 1 ? '' : 's'} picked up at least one new value from ${fileName ?? 'your file'}. Only fields that actually changed are listed below.`;

  const palette = {
    emerald: 'bg-emerald-50 ring-emerald-200 text-emerald-900',
    amber: 'bg-amber-50 ring-amber-200 text-amber-900',
    red: 'bg-red-50 ring-red-200 text-red-900',
  }[tone];
  const iconColor = { emerald: 'text-emerald-600', amber: 'text-amber-600', red: 'text-red-600' }[tone];
  const Icon = tone === 'emerald' ? CheckCircle2 : tone === 'red' ? XCircle : ArrowRightLeft;

  return (
    <div className="flex flex-col gap-5">
      <div className={`rounded-xl ring-1 px-5 py-4 flex items-start gap-3 ${palette}`}>
        <Icon className={`w-6 h-6 mt-0.5 flex-shrink-0 ${iconColor}`} />
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{headline}</h2>
          <p className="text-sm mt-0.5 text-gray-700">{detail}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatTile
          tone="emerald"
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Updated"
          value={result.updated}
          sub={result.updated === 1 ? 'customer changed' : 'customers changed'}
        />
        <StatTile
          tone="gray"
          icon={<Equal className="w-5 h-5" />}
          label="Already correct"
          value={result.unchanged}
          sub="no change needed"
        />
        <StatTile
          tone={result.skipped > 0 ? 'red' : 'gray'}
          icon={<XCircle className="w-5 h-5" />}
          label="Not applied"
          value={result.skipped}
          sub={result.skipped === 1 ? 'row needs a fix' : 'rows need a fix'}
        />
      </div>

      {anyUpdated && <ChangeSection rows={result.updatedAccounts} total={result.updated} />}
      {anyErrors && <ErrorSection errors={result.errors} total={result.errors.length} />}

      <Card>
        <CardContent className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            {fileName ? (
              <>
                <span className="font-medium text-gray-900">{fileName}</span> — {total}{' '}
                {total === 1 ? 'row' : 'rows'} processed.
              </>
            ) : (
              <>
                {total} {total === 1 ? 'row' : 'rows'} processed.
              </>
            )}
          </p>
          <div className="flex gap-2">
            {result.updated > 0 && (
              <Link
                href="/geography"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-brand-600 bg-orange-50 hover:bg-orange-100 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                See Zones &amp; Cities
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
            <Button type="button" variant="outline" onClick={onReset}>
              Upload another file
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** What changed, old → new, so the operator can spot a bad column mapping. */
function ChangeSection({ rows, total }: { rows: BulkUpdatePreview[]; total: number }) {
  const visible = rows.slice(0, PREVIEW_LIMIT);
  return (
    <Card>
      <CardContent className="px-6 pt-5 pb-5">
        <div className="flex flex-col gap-1 mb-3">
          <h3 className="text-sm font-semibold text-gray-900">What changed ({total})</h3>
          <p className="text-xs text-gray-500">
            {total > PREVIEW_LIMIT
              ? `Showing the first ${PREVIEW_LIMIT}. `
              : ''}
            Old value on the left, new on the right. Fields not listed were left as they were.
          </p>
        </div>
        <div className="border border-gray-200 rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Row</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="w-40">Circuit ID</TableHead>
                <TableHead>Changes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((r) => (
                <TableRow key={r.accountId}>
                  <TableCell className="text-gray-500 font-mono text-xs">{r.rowNumber}</TableCell>
                  <TableCell className="font-medium text-gray-900">{r.clientName}</TableCell>
                  <TableCell className="font-mono text-xs text-gray-600">
                    {r.circuitId ?? '—'}
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="flex flex-col gap-1">
                      {r.changes.map((c) => (
                        <div key={c.field} className="flex items-center gap-1.5 text-xs flex-wrap">
                          <span className="font-medium text-gray-500 w-14 shrink-0">
                            {FIELD_LABEL[c.field]}
                          </span>
                          <span className="text-gray-400 line-through">{c.from ?? 'empty'}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="font-medium text-gray-900">{c.to}</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

const ERROR_KIND_META: Record<BulkUpdateErrorKind, { label: string; tone: PillTone }> = {
  missing_field: { label: 'Nothing to set', tone: 'amber' },
  not_found: { label: 'No match', tone: 'red' },
  ambiguous: { label: 'Ambiguous', tone: 'amber' },
  invalid_value: { label: 'Invalid value', tone: 'amber' },
  other: { label: 'DB error', tone: 'red' },
};

function ErrorSection({ errors, total }: { errors: BulkUpdateError[]; total: number }) {
  const visible = errors.slice(0, ERROR_LIMIT);
  const hidden = total - visible.length;
  return (
    <Card>
      <CardContent className="px-6 pt-5 pb-5">
        <div className="flex flex-col gap-1 mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Rows not applied ({total})</h3>
          <p className="text-xs text-gray-500">
            These rows were left alone. Nothing was created for them — fix the row and re-upload.
          </p>
        </div>
        <div className="border border-gray-200 rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Row</TableHead>
                <TableHead className="w-36">Issue</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((e, i) => {
                const meta = ERROR_KIND_META[e.kind];
                return (
                  <TableRow key={`${e.rowNumber}-${i}`}>
                    <TableCell className="text-gray-500 font-mono text-xs">{e.rowNumber}</TableCell>
                    <TableCell>
                      <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {e.clientName ?? <span className="text-gray-400">—</span>}
                      {e.circuitId && (
                        <span className="block font-mono text-[11px] text-gray-500">
                          {e.circuitId}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-700 whitespace-normal text-sm">
                      {e.reason}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {hidden > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            + {hidden} more not shown.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatTile({
  tone,
  icon,
  label,
  value,
  sub,
}: {
  tone: 'emerald' | 'gray' | 'red';
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
}) {
  const palette = {
    emerald: { ring: 'ring-emerald-200', icon: 'text-emerald-600 bg-emerald-50' },
    gray: { ring: 'ring-gray-200', icon: 'text-gray-500 bg-gray-50' },
    red: { ring: 'ring-red-200', icon: 'text-red-600 bg-red-50' },
  }[tone];
  return (
    <div className={`bg-white rounded-xl ring-1 ${palette.ring} p-4 flex items-center gap-4`}>
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${palette.icon}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-xs text-gray-500">{sub}</p>
      </div>
    </div>
  );
}
