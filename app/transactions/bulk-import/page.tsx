'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, FileSpreadsheet, RefreshCcw, XCircle } from 'lucide-react';
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
import { PageHeader } from '../../../components/page-header';
import { FormSection } from '../../../components/form-section';
import { FileDropZone } from '../../../components/file-drop-zone';
import { StatusPill, type PillTone } from '../../../components/status-pill';
import { formatRupees } from '../../../lib/format-rupees';
import {
  bulkImportCommercialChanges,
  type BulkImportSummary,
  type BulkImportedRowPreview,
  type BulkImportError,
} from '../../../services/commercial-changes-bulk-import';

const PREVIEW_LIMIT = 25;
const ERROR_LIMIT = 50;

const CHANGE_TONE: Record<BulkImportedRowPreview['changeType'], PillTone> = {
  UPGRADE: 'emerald',
  DOWNGRADE: 'amber',
  RATE_REVISION: 'orange',
  DISCONNECTION: 'red',
};

export default function BulkImportTransactionsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkImportSummary | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const summary = await bulkImportCommercialChanges(file);
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-6">
      <PageHeader
        title="Bulk Import Commercial Changes"
        subtitle="Upload one .xlsx / .csv to commit many UPGRADE / DOWNGRADE / RATE_REVISION / DISCONNECTION rows at once"
      />

      <Link
        href="/transactions"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-brand-600 -mt-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Transactions
      </Link>

      {!result && (
        <form onSubmit={onSubmit}>
          <Card>
            <CardContent className="px-4 sm:px-6 pt-6 pb-0 divide-y divide-gray-100">
              <FormSection
                title="Upload"
                description="Each row commits one commercial change directly against the matching circuit. No CRM round-trip, no documents — the same fast path as backfill-disconnection, generalised to all 4 change types. Admin-only. Every row is audit-logged with your user, IP, and a source=BULK_EXCEL tag."
              >
                <div className="sm:col-span-2 flex flex-col gap-3">
                  <p className="text-sm text-gray-500">
                    Invalid rows are reported back; valid rows still commit. Re-running with the same row creates a second
                    change — fix the source spreadsheet before re-uploading.
                  </p>
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
              <FormSection
                title="Recognized columns"
                description="Headers match loosely (case, spaces, underscores, slashes and hyphens are ignored). Use ANY of the spellings on the right and it'll be picked up."
              >
                <div className="sm:col-span-2">
                  <RecognizedColumnsTable />
                </div>
              </FormSection>
            </CardContent>

            <div className="flex items-center justify-end gap-2 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-xl">
              <Button
                type="submit"
                disabled={!file || submitting}
                size="lg"
                className="bg-brand-600 text-white hover:bg-brand-700"
              >
                {submitting ? 'Uploading…' : 'Upload & commit'}
              </Button>
            </div>
          </Card>
        </form>
      )}

      {result && <ResultPanel result={result} fileName={fileName} onReset={reset} />}
    </div>
  );
}

// ─── Result panel ─────────────────────────────────────────────────────

function ResultPanel({
  result,
  fileName,
  onReset,
}: {
  result: BulkImportSummary;
  fileName: string | null;
  onReset: () => void;
}) {
  const totalRowsTouched = result.imported + result.skipped;
  const anyCommitted = result.appliedChanges.length > 0;
  const anyErrors = result.errors.length > 0;
  const hasPartial = anyErrors && anyCommitted;

  return (
    <div className="flex flex-col gap-5">
      <HeadlineBanner
        imported={result.imported}
        skipped={result.skipped}
        totalRowsTouched={totalRowsTouched}
        fileName={fileName}
        partial={hasPartial}
        zeroSuccess={result.imported === 0}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatTile
          tone="emerald"
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Committed"
          value={result.imported}
          sub={result.imported === 1 ? 'change applied' : 'changes applied'}
        />
        <StatTile
          tone={result.skipped > 0 ? 'red' : 'gray'}
          icon={<XCircle className="w-5 h-5" />}
          label="Rejected"
          value={result.skipped}
          sub={result.skipped === 1 ? 'row needs a fix' : 'rows need a fix'}
        />
      </div>

      {anyCommitted && (
        <PreviewSection
          title="Committed changes"
          subtitle={
            result.imported > PREVIEW_LIMIT
              ? `Showing first ${PREVIEW_LIMIT} of ${result.imported} — view the rest on the transactions page.`
              : 'Each row updated its account and wrote a commercial-change record. The dashboard waterfall reflects them now.'
          }
          rows={result.appliedChanges.slice(0, PREVIEW_LIMIT)}
        />
      )}

      {anyErrors && <ErrorSection errors={result.errors.slice(0, ERROR_LIMIT)} total={result.errors.length} />}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onReset}>
          <RefreshCcw className="w-4 h-4 mr-1.5" />
          Upload another file
        </Button>
        <Button asChild>
          <Link href="/transactions">
            View transactions
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function HeadlineBanner({
  imported,
  skipped,
  totalRowsTouched,
  fileName,
  partial,
  zeroSuccess,
}: {
  imported: number;
  skipped: number;
  totalRowsTouched: number;
  fileName: string | null;
  partial: boolean;
  zeroSuccess: boolean;
}) {
  const headline = zeroSuccess
    ? `No rows committed${skipped > 0 ? ` — ${skipped} row${skipped === 1 ? '' : 's'} had errors` : ''}`
    : partial
      ? `${imported} of ${totalRowsTouched} committed — ${skipped} rejected`
      : `${imported} change${imported === 1 ? '' : 's'} committed`;

  const tone = zeroSuccess ? 'red' : partial ? 'amber' : 'emerald';
  const toneClass: Record<typeof tone, string> = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    red: 'bg-red-50 border-red-200 text-red-900',
  };
  return (
    <div className={`rounded-xl border px-5 py-4 flex items-start gap-3 ${toneClass[tone]}`}>
      <FileSpreadsheet className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{headline}</p>
        {fileName && <p className="text-xs opacity-80 mt-0.5 truncate">From {fileName}</p>}
      </div>
    </div>
  );
}

function StatTile({
  tone,
  icon,
  label,
  value,
  sub,
}: {
  tone: 'emerald' | 'red' | 'gray';
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
}) {
  const toneClass: Record<typeof tone, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    red: 'bg-red-50 text-red-700 ring-red-100',
    gray: 'bg-gray-50 text-gray-500 ring-gray-100',
  };
  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-200 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-md grid place-items-center ring-1 ${toneClass[tone]}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-2xl font-bold tabular-nums text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">
          {label} · {sub}
        </div>
      </div>
    </div>
  );
}

function PreviewSection({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: BulkImportedRowPreview[];
}) {
  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-200">
      <header className="px-4 sm:px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </header>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs uppercase tracking-wider whitespace-nowrap">Row</TableHead>
              <TableHead className="text-xs uppercase tracking-wider whitespace-nowrap">Circuit</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Customer</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Change</TableHead>
              <TableHead className="text-xs uppercase tracking-wider whitespace-nowrap text-right">
                Old → New ARC
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider whitespace-nowrap">Effective</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={`${r.rowNumber}-${r.circuitId}`}>
                <TableCell className="text-xs text-gray-500 tabular-nums">{r.rowNumber}</TableCell>
                <TableCell className="font-mono text-xs">{r.circuitId}</TableCell>
                <TableCell className="text-sm">{r.clientName}</TableCell>
                <TableCell>
                  <StatusPill tone={CHANGE_TONE[r.changeType]}>{r.changeType.replace('_', ' ')}</StatusPill>
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  <span className="text-gray-500">{formatRupees(r.oldArc)}</span>{' '}
                  <span className="mx-1 text-gray-400">→</span>{' '}
                  <span className="font-semibold text-gray-900">{formatRupees(r.newArc)}</span>
                </TableCell>
                <TableCell className="text-xs text-gray-700 whitespace-nowrap">{r.effectiveDate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ErrorSection({ errors, total }: { errors: BulkImportError[]; total: number }) {
  return (
    <div className="bg-white rounded-xl ring-1 ring-red-200">
      <header className="px-4 sm:px-5 py-3 border-b border-red-100 bg-red-50/40 rounded-t-xl">
        <h3 className="text-sm font-semibold text-red-900">
          Rejected rows {total > errors.length && `(showing first ${errors.length} of ${total})`}
        </h3>
        <p className="text-xs text-red-700 mt-0.5">Fix these in the source spreadsheet and re-upload — they did not commit.</p>
      </header>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs uppercase tracking-wider whitespace-nowrap">Row</TableHead>
              <TableHead className="text-xs uppercase tracking-wider whitespace-nowrap">Circuit</TableHead>
              <TableHead className="text-xs uppercase tracking-wider whitespace-nowrap">Kind</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {errors.map((e, i) => (
              <TableRow key={`${e.rowNumber}-${i}`}>
                <TableCell className="text-xs text-gray-500 tabular-nums">{e.rowNumber}</TableCell>
                <TableCell className="font-mono text-xs">{e.circuitId ?? '—'}</TableCell>
                <TableCell className="text-xs">
                  <code className="bg-gray-100 rounded px-1.5 py-0.5">{e.kind}</code>
                </TableCell>
                <TableCell className="text-sm text-gray-700">{e.reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Recognized columns reference table ────────────────────────────────

function RecognizedColumnsTable() {
  const rows = [
    { canonical: 'Circuit ID', required: 'Always', aliases: 'Circuit ID · Circuit · Circuit No · Circuit Number' },
    { canonical: 'Change Type', required: 'Always', aliases: 'Change Type · Type · Action — UPGRADE / DOWNGRADE / RATE_REVISION / DISCONNECTION' },
    { canonical: 'New ARC (₹/year)', required: 'UPGRADE / DOWNGRADE / RATE_REVISION', aliases: 'New ARC · ARC · New Annual ARC' },
    { canonical: 'New Bandwidth (Mbps)', required: 'Optional (recommended for UPGRADE / RATE_REVISION)', aliases: 'New Bandwidth · Bandwidth · BW' },
    { canonical: 'Effective Date', required: 'Always', aliases: 'Effective Date · Date — YYYY-MM-DD' },
    { canonical: 'Mail Received Date', required: 'Optional', aliases: 'Mail Received Date · Approval Date — YYYY-MM-DD' },
    { canonical: 'Disconnection Reason', required: 'DISCONNECTION only', aliases: 'Disconnection Reason · Termination Reason — must match a code from /commercial-changes/disconnection-reasons' },
    { canonical: 'Reason / Notes', required: 'Optional', aliases: 'Reason · Notes · Remarks' },
  ];
  return (
    <div className="overflow-x-auto rounded-lg ring-1 ring-gray-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs uppercase tracking-wider whitespace-nowrap">Canonical column</TableHead>
            <TableHead className="text-xs uppercase tracking-wider whitespace-nowrap">Required</TableHead>
            <TableHead className="text-xs uppercase tracking-wider">Accepted spellings</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.canonical}>
              <TableCell className="text-sm font-medium text-gray-900 whitespace-nowrap">{r.canonical}</TableCell>
              <TableCell className="text-xs">
                <code className="bg-gray-100 rounded px-1.5 py-0.5">{r.required}</code>
              </TableCell>
              <TableCell className="text-xs text-gray-600">{r.aliases}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
