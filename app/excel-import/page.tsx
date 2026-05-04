'use client';

import { useState, type FormEvent } from 'react';
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
import { StatusPill } from '../../components/status-pill';
import { importAccounts, type ImportSummary } from '../../services/import';

const ERROR_LIMIT = 50;

export default function ExcelImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportSummary | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const summary = await importAccounts(file);
      setResult(summary);
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
  }

  const visibleErrors = result?.errors.slice(0, ERROR_LIMIT) ?? [];
  const hiddenErrorCount = result ? Math.max(0, result.errors.length - ERROR_LIMIT) : 0;

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
                description="Required columns: Customer Name and Onboarding Date. Common columns (Company, Mobile, Lead ID, Plan, Status, ARC) are auto-detected when present. Anything else is preserved as metadata."
              >
                <div className="sm:col-span-2 flex flex-col gap-3">
                  <p className="text-sm text-gray-500">
                    Rows without ARC import with ₹0 — fill in later from the customer page.
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
        <Card>
          <CardContent className="px-6 pt-6 pb-0 divide-y divide-gray-100">
            <FormSection
              title="Result"
              description="Summary of the import. Fix any flagged rows in your file and re-upload to bring them in."
            >
              <div className="sm:col-span-2 flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone="emerald">Imported: {result.imported}</StatusPill>
                  <StatusPill tone="amber">Updated: {result.updated}</StatusPill>
                  <StatusPill tone="red">Skipped: {result.skipped}</StatusPill>
                </div>

                {result.errors.length > 0 && (
                  <>
                    <Alert variant="destructive">
                      <AlertTitle>{result.errors.length} row error(s)</AlertTitle>
                      <AlertDescription>
                        The rows below were skipped. Fix them in your file and re-upload.
                      </AlertDescription>
                    </Alert>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-24">Row</TableHead>
                            <TableHead>Reason</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {visibleErrors.map((err, i) => (
                            <TableRow key={`${err.rowNumber}-${i}`}>
                              <TableCell className="font-medium">{err.rowNumber}</TableCell>
                              <TableCell className="text-red-600 whitespace-normal">
                                {err.reason}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {hiddenErrorCount > 0 && (
                      <p className="text-xs text-gray-500">
                        + {hiddenErrorCount} more error{hiddenErrorCount === 1 ? '' : 's'} not shown.
                      </p>
                    )}
                  </>
                )}
              </div>
            </FormSection>
          </CardContent>

          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-xl">
            <Button type="button" variant="outline" onClick={reset}>
              Upload another file
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
