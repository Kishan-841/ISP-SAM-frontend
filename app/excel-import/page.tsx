'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, FileSpreadsheet, RefreshCcw, XCircle } from 'lucide-react';
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
import { PageHeader } from '../../components/page-header';
import { FormSection } from '../../components/form-section';
import { FileDropZone } from '../../components/file-drop-zone';
import { StatusPill, type PillTone } from '../../components/status-pill';
import { formatRupees } from '../../lib/format-rupees';
import {
  importAccounts,
  type ImportError,
  type ImportErrorKind,
  type ImportSummary,
  type ImportedAccountPreview,
} from '../../services/import';

const PREVIEW_LIMIT = 25;
const ERROR_LIMIT = 50;

export default function ExcelImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const summary = await importAccounts(file);
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
    <div className="max-w-6xl mx-auto p-8 flex flex-col gap-6">
      <PageHeader
        title="Excel Import"
        subtitle="Upload a .xlsx or .csv file of existing customers"
      />

      {!result && (
        <form onSubmit={onSubmit}>
          <Card>
            <CardContent className="px-6 pt-6 pb-0 divide-y divide-gray-100">
              <FormSection
                title="Upload"
                description="Required columns: Customer Name, Onboarding Date, and ARC (or MRR — auto-converted to annual). Common columns (Company, Mobile, Email, Lead ID, Plan, Status, Bandwidth, Circuit ID, Customer Code, Address, SAM) are auto-detected when present — headers are matched loosely (case, spaces, and underscores don't matter). SAM column can be the SAM's email (preferred) or full name. Anything else is preserved as metadata."
              >
                <div className="sm:col-span-2 flex flex-col gap-3">
                  <p className="text-sm text-gray-500">
                    Rows missing any required column will be reported back so you can fix and re-upload.
                    Re-importing the same Lead ID updates the existing customer instead of creating a duplicate.
                  </p>
                  <FileDropZone
                    accept=".xlsx,.xls,.csv"
                    file={file}
                    onFileChange={(f) => { setFile(f); setError(null); }}
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
                description="Headers match loosely (case, spaces and underscores ignored). Use ANY of the spellings on the right and it'll be picked up."
              >
                <div className="sm:col-span-2">
                  <RecognizedColumnsTable />
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
                {submitting ? 'Uploading…' : 'Upload'}
              </Button>
            </div>
          </Card>
        </form>
      )}

      {result && (
        <ResultPanel result={result} fileName={fileName} onReset={reset} />
      )}
    </div>
  );
}

// ─── Result panel ─────────────────────────────────────────────────────

function ResultPanel({
  result,
  fileName,
  onReset,
}: {
  result: ImportSummary;
  fileName: string | null;
  onReset: () => void;
}) {
  const totalRowsTouched = result.imported + result.updated + result.skipped;
  const anyCreated = result.createdAccounts.length > 0;
  const anyUpdated = result.updatedAccounts.length > 0;
  const anyErrors = result.errors.length > 0;
  const hasPartial = anyErrors && (anyCreated || anyUpdated);

  return (
    <div className="flex flex-col gap-5">
      {/* Headline banner */}
      <HeadlineBanner
        imported={result.imported}
        updated={result.updated}
        skipped={result.skipped}
        totalRowsTouched={totalRowsTouched}
        fileName={fileName}
        partial={hasPartial}
        zeroSuccess={result.imported === 0 && result.updated === 0}
      />

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatTile
          tone="emerald"
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Newly created"
          value={result.imported}
          sub={result.imported === 1 ? 'customer added' : 'customers added'}
        />
        <StatTile
          tone="blue"
          icon={<RefreshCcw className="w-5 h-5" />}
          label="Updated existing"
          value={result.updated}
          sub={result.updated === 1 ? 'customer refreshed' : 'customers refreshed'}
        />
        <StatTile
          tone={result.skipped > 0 ? 'red' : 'gray'}
          icon={<XCircle className="w-5 h-5" />}
          label="Rejected"
          value={result.skipped}
          sub={result.skipped === 1 ? 'row needs a fix' : 'rows need a fix'}
        />
      </div>

      {/* Newly created preview */}
      {anyCreated && (
        <PreviewSection
          title="Newly created customers"
          subtitle={
            result.imported > PREVIEW_LIMIT
              ? `Showing first ${PREVIEW_LIMIT} of ${result.imported} — view the rest on the customers page.`
              : 'These customers were added to SAM. Check that names, ARC, and kitty look right.'
          }
          rows={result.createdAccounts.slice(0, PREVIEW_LIMIT)}
        />
      )}

      {/* Updated existing preview */}
      {anyUpdated && (
        <PreviewSection
          title="Updated existing customers"
          subtitle={
            result.updated > PREVIEW_LIMIT
              ? `Showing first ${PREVIEW_LIMIT} of ${result.updated} — view the rest on the customers page.`
              : 'These customers already existed (matched by Lead ID or CRM ID) and were refreshed with the new values.'
          }
          rows={result.updatedAccounts.slice(0, PREVIEW_LIMIT)}
        />
      )}

      {/* Rejected rows */}
      {anyErrors && (
        <ErrorSection
          errors={result.errors}
          shown={Math.min(result.errors.length, ERROR_LIMIT)}
          total={result.errors.length}
        />
      )}

      {/* Footer actions */}
      <Card>
        <CardContent className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            {fileName ? (
              <>
                <span className="font-medium text-gray-900">{fileName}</span> — {totalRowsTouched}{' '}
                {totalRowsTouched === 1 ? 'row' : 'rows'} processed.
              </>
            ) : (
              <>{totalRowsTouched} {totalRowsTouched === 1 ? 'row' : 'rows'} processed.</>
            )}
          </p>
          <div className="flex gap-2">
            {(anyCreated || anyUpdated) && (
              <Link
                href="/customers"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-brand-600 bg-orange-50 hover:bg-orange-100 transition-colors"
              >
                View all customers
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

// ─── Recognized columns reference ─────────────────────────────────────

const RECOGNIZED_COLUMNS: Array<{
  field: string;
  required?: boolean;
  spellings: string[];
  hint?: string;
}> = [
  { field: 'Customer Name', required: true, spellings: ['Customer Name', 'Client', 'Name', 'Subscriber'] },
  { field: 'Onboarding Date', required: true, spellings: ['Onboarding Date', 'Start Date', 'Billing Start Date', 'Activation Date', 'Installation Date'], hint: 'ISO (2025-03-15), DD/MM/YYYY, and DD-MMM-YY/YYYY (31-Aug-20) all work.' },
  { field: 'ARC (₹/year)', required: true, spellings: ['ARC', 'Current ARC', 'Annual Revenue'], hint: 'Monthly MRR headers (Plan Price, Tariff, etc.) are auto-multiplied ×12.' },
  { field: 'Company', spellings: ['Company', 'Company Name', 'Organization'] },
  { field: 'Mobile', spellings: ['Mobile', 'Phone', 'Contact', 'Contact Number'] },
  { field: 'Email', spellings: ['Email', 'Email Address', 'Email ID', 'Customer Email'], hint: 'Parenthesised qualifiers like "Email ID(IT)" are stripped automatically.' },
  { field: 'Contract Status', spellings: ['Status', 'Contract Status', 'Connection Status'], hint: 'Accepts Active, Live, Pending, Expired, Terminated, Disconnected, etc.' },
  { field: 'Lead ID', spellings: ['Lead ID', 'Lead'] },
  { field: 'CRM Customer ID', spellings: ['CRM ID', 'Customer ID', 'Subscriber ID', 'Connection ID'] },
  { field: 'Current Plan', spellings: ['Plan', 'Current Plan', 'Package'] },
  { field: 'Bandwidth (Mbps)', spellings: ['Bandwidth', 'Mbps', 'Speed', 'BW', 'Current BW'] },
  { field: 'Circuit ID', spellings: ['Circuit ID', 'Circuit', 'Circuit No', 'Circuit Number'] },
  { field: 'Customer Code', spellings: ['Customer Code', 'Cust Code', 'Account Code', 'Code'] },
  { field: 'Address', spellings: ['Address', 'Installation Address', 'Service Address', 'Site Address', 'Billing Address', 'Location'] },
  { field: 'SAM (assignment)', spellings: ['SAM', 'SAM Email', 'SAM Name', 'Assigned SAM', 'Assigned To', 'Owner', 'Owner Email'], hint: 'Email > exact full name > first-name (e.g. "Mangesh" → "Mangesh Fulbandhe" if only one such user). Ambiguous first names are reported.' },
  { field: 'GST No', spellings: ['GST', 'GST No', 'GST Number', 'GSTIN', 'Tax ID'] },
  { field: 'Contact Person', spellings: ['Contact Person', 'Contact Person Name', 'Contact Name', 'Primary Contact', 'SPOC'] },
  { field: 'Industry Type', spellings: ['Industry', 'Industry Type', 'Sector', 'Vertical', 'Business Type'] },
  { field: 'Circle / Zone', spellings: ['Circle', 'Zone', 'Region', 'Area'] },
  { field: 'Account Manager', spellings: ['Account Manager', 'AM', 'AM Name', 'Internal AM'], hint: 'Distinct from the SAM column — this is the internal Account Manager role.' },
  { field: 'User Name (internal slug)', spellings: ['User Name', 'Login Name', 'Internal Code', 'Internal Slug'] },
  { field: 'IP Details', spellings: ['IP Details', 'IP', 'IP Address', 'IP Addresses', 'Assigned IPs'], hint: 'Comma-separated free text. Kept verbatim.' },
];

function RecognizedColumnsTable() {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-56">Field</TableHead>
            <TableHead>Header spellings accepted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {RECOGNIZED_COLUMNS.map((c) => (
            <TableRow key={c.field}>
              <TableCell className="font-medium text-gray-900 align-top">
                <div className="flex items-center gap-1.5">
                  <span>{c.field}</span>
                  {c.required && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                      Required
                    </span>
                  )}
                </div>
                {c.hint && <p className="text-[11px] text-gray-500 mt-1 font-normal">{c.hint}</p>}
              </TableCell>
              <TableCell className="text-gray-700 text-sm">
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Headline banner ──────────────────────────────────────────────────

function HeadlineBanner({
  imported,
  updated,
  skipped,
  totalRowsTouched,
  fileName,
  partial,
  zeroSuccess,
}: {
  imported: number;
  updated: number;
  skipped: number;
  totalRowsTouched: number;
  fileName: string | null;
  partial: boolean;
  zeroSuccess: boolean;
}) {
  const tone = zeroSuccess ? 'red' : partial ? 'amber' : 'emerald';
  const Icon = zeroSuccess ? XCircle : partial ? FileSpreadsheet : CheckCircle2;
  const headline = zeroSuccess
    ? 'Import failed — no rows could be saved'
    : partial
      ? `Partial import — ${imported + updated} of ${totalRowsTouched} rows saved`
      : `Import complete — ${imported + updated} of ${totalRowsTouched} rows saved`;
  const detail = (() => {
    if (zeroSuccess) {
      return `Every row in ${fileName ?? 'your file'} was rejected. See the table below for the reason against each row.`;
    }
    if (partial) {
      return `${skipped} row${skipped === 1 ? '' : 's'} couldn't be saved — fix those rows in ${fileName ?? 'your file'} and re-upload to bring them in.`;
    }
    if (imported > 0 && updated > 0) {
      return `${imported} new and ${updated} existing customer${updated === 1 ? '' : 's'} from ${fileName ?? 'your file'} are now in SAM.`;
    }
    if (imported > 0) {
      return `${imported} customer${imported === 1 ? '' : 's'} from ${fileName ?? 'your file'} are now in SAM.`;
    }
    return `${updated} existing customer${updated === 1 ? '' : 's'} from ${fileName ?? 'your file'} were refreshed.`;
  })();

  const palette = {
    emerald: 'bg-emerald-50 ring-emerald-200 text-emerald-900',
    amber:   'bg-amber-50 ring-amber-200 text-amber-900',
    red:     'bg-red-50 ring-red-200 text-red-900',
  }[tone];
  const iconColor = {
    emerald: 'text-emerald-600',
    amber:   'text-amber-600',
    red:     'text-red-600',
  }[tone];

  return (
    <div className={`rounded-xl ring-1 px-5 py-4 flex items-start gap-3 ${palette}`}>
      <Icon className={`w-6 h-6 mt-0.5 flex-shrink-0 ${iconColor}`} />
      <div className="min-w-0">
        <h2 className="text-base font-semibold">{headline}</h2>
        <p className="text-sm mt-0.5 text-gray-700">{detail}</p>
      </div>
    </div>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────

function StatTile({
  tone,
  icon,
  label,
  value,
  sub,
}: {
  tone: 'emerald' | 'blue' | 'red' | 'gray';
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
}) {
  const palette = {
    emerald: { ring: 'ring-emerald-200', icon: 'text-emerald-600 bg-emerald-50' },
    blue:    { ring: 'ring-blue-200',    icon: 'text-blue-600 bg-blue-50' },
    red:     { ring: 'ring-red-200',     icon: 'text-red-600 bg-red-50' },
    gray:    { ring: 'ring-gray-200',    icon: 'text-gray-500 bg-gray-50' },
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

// ─── Preview section ──────────────────────────────────────────────────

function PreviewSection({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: ImportedAccountPreview[];
}) {
  return (
    <Card>
      <CardContent className="px-6 pt-5 pb-5">
        <div className="flex flex-col gap-1 mb-3">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className="border border-gray-200 rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Row</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Lead ID</TableHead>
                <TableHead className="text-right">ARC</TableHead>
                <TableHead>Kitty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SAM</TableHead>
                <TableHead>Circuit ID</TableHead>
                <TableHead>Customer Code</TableHead>
                <TableHead>Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.accountId}>
                  <TableCell className="text-gray-500 font-mono text-xs">{r.rowNumber}</TableCell>
                  <TableCell className="font-medium text-gray-900">{r.clientName}</TableCell>
                  <TableCell className="text-gray-700">{r.companyName ?? '—'}</TableCell>
                  <TableCell className="font-mono text-xs text-gray-600">
                    {r.leadId ?? '—'}
                  </TableCell>
                  <TableCell className="text-right font-medium text-gray-900">
                    {formatRupees(r.currentArc)}
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={r.kittyType === 'BASE' ? 'blue' : 'emerald'}>
                      {r.kittyType}
                    </StatusPill>
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={contractStatusTone(r.contractStatus)}>
                      {r.contractStatus}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {r.samOwnerName ?? (
                      <span className="text-amber-700 text-xs italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-gray-600">
                    {r.circuitId ?? '—'}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-gray-600">
                    {r.customerCode ?? '—'}
                  </TableCell>
                  <TableCell
                    className="text-gray-700 text-xs max-w-[260px] truncate"
                    title={r.address ?? ''}
                  >
                    {r.address ?? '—'}
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

// ─── Error section ────────────────────────────────────────────────────

const ERROR_KIND_META: Record<ImportErrorKind, { label: string; tone: PillTone }> = {
  missing_field: { label: 'Missing field', tone: 'amber' },
  invalid_value: { label: 'Invalid value', tone: 'amber' },
  duplicate:     { label: 'Duplicate',     tone: 'red' },
  warning:       { label: 'Notice',        tone: 'amber' },
  other:         { label: 'DB error',      tone: 'red' },
};

function ErrorSection({
  errors,
  shown,
  total,
}: {
  errors: ImportError[];
  shown: number;
  total: number;
}) {
  const visible = errors.slice(0, shown);
  const hidden = total - shown;
  return (
    <Card>
      <CardContent className="px-6 pt-5 pb-5">
        <div className="flex flex-col gap-1 mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Rejected rows ({total})
          </h3>
          <p className="text-xs text-gray-500">
            These rows couldn't be saved. Fix them in your file and re-upload to bring them in.
          </p>
        </div>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Row</TableHead>
                <TableHead className="w-32">Issue</TableHead>
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
                      {e.leadId && (
                        <span className="block font-mono text-[11px] text-gray-500">
                          {e.leadId}
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
            + {hidden} more error{hidden === 1 ? '' : 's'} not shown.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function contractStatusTone(status: ImportedAccountPreview['contractStatus']): PillTone {
  switch (status) {
    case 'ACTIVE':       return 'emerald';
    case 'PENDING':      return 'amber';
    case 'EXPIRED':      return 'gray';
    case 'TERMINATED':   return 'red';
    case 'DISCONNECTING':return 'orange';
  }
}
