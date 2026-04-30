'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '../../components/page-header';
import { importAccounts, type ImportSummary } from '../../services/import';

const ERROR_LIMIT = 50;

export default function ExcelImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportSummary | null>(null);

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.files?.[0] ?? null;
    setFile(next);
    setError(null);
  }

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
    <div className="max-w-6xl mx-auto p-8 flex flex-col gap-4">
      <PageHeader
        title="Excel Import"
        subtitle="Upload a .xlsx or .csv file of existing customers"
      />

      {!result && (
        <Card>
          <CardHeader>
            <CardTitle>Upload file</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <p className="text-sm text-gray-500">
                Required columns: Customer Name, Onboarding Date, and either MRR or ARC.
                Other common columns (Company, Mobile, Lead ID, Plan, Status) are
                auto-detected. Anything else is preserved as metadata.
              </p>
              <div className="flex flex-col gap-2">
                <Label htmlFor="import-file">File</Label>
                <Input
                  id="import-file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={onFileChange}
                  disabled={submitting}
                />
                {file && (
                  <p className="text-xs text-gray-500">
                    Selected: <span className="font-medium text-gray-700">{file.name}</span>
                  </p>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Upload failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Button type="submit" disabled={!file || submitting}>
                  {submitting ? 'Uploading…' : 'Upload'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Import summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default" className="bg-emerald-600 text-white">
                Imported: {result.imported}
              </Badge>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                Updated: {result.updated}
              </Badge>
              <Badge variant="destructive">Skipped: {result.skipped}</Badge>
            </div>

            {result.errors.length > 0 && (
              <>
                <Alert variant="destructive">
                  <AlertTitle>{result.errors.length} row error(s)</AlertTitle>
                  <AlertDescription>
                    The rows below were skipped. Fix them in your file and re-upload.
                  </AlertDescription>
                </Alert>
                <div className="border rounded-lg overflow-hidden">
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

            <div>
              <Button type="button" variant="outline" onClick={reset}>
                Upload another file
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
