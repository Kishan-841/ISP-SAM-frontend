'use client';

import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from './page-header';
import { EmailDraftModal } from './email-draft-modal';
import {
  commitCommercialChange,
  type CommitInput,
  type CommitResult,
} from '../services/commercial-changes';
import type { Account } from '../services/accounts';

type ActionType = CommitInput['changeType'] | '';

const ACTION_LABELS: Record<CommitInput['changeType'], string> = {
  UPGRADE: 'Upgrade',
  DOWNGRADE: 'Downgrade',
  RATE_REVISION: 'Rate Revision',
  TERMINATION: 'Termination',
};

function formatCustomerLabel(account: Account): string {
  const code = account.customerCode ? ` (${account.customerCode})` : '';
  return `${account.clientName}${code}`;
}

function todayIso(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function CommercialChangeForm({ accounts }: { accounts: Account[] }) {
  const router = useRouter();

  const [customerId, setCustomerId] = useState<string>('');
  const [actionType, setActionType] = useState<ActionType>('');
  const [effectiveDate, setEffectiveDate] = useState<string>(todayIso());
  const [newBandwidthMbps, setNewBandwidthMbps] = useState<string>('');
  const [newMrr, setNewMrr] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CommitResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === customerId) ?? null,
    [accounts, customerId],
  );

  const isTermination = actionType === 'TERMINATION';

  function resetForm() {
    setCustomerId('');
    setActionType('');
    setEffectiveDate(todayIso());
    setNewBandwidthMbps('');
    setNewMrr('');
    setReason('');
    setFile(null);
    setError(null);
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  function onModalOpenChange(open: boolean) {
    setModalOpen(open);
    if (!open) {
      // Modal closed — clear the result and reset the form for the next entry.
      setResult(null);
      resetForm();
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!customerId || !actionType || !effectiveDate || !file) return;
    if (!isTermination && !newMrr) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: CommitInput = {
        accountId: customerId,
        changeType: actionType,
        newMrr: isTermination ? 0 : Number(newMrr),
        effectiveDate,
        file,
      };
      if (newBandwidthMbps) payload.newBandwidthMbps = Number(newBandwidthMbps);
      if (reason.trim()) payload.reason = reason.trim();

      const res = await commitCommercialChange(payload);
      setResult(res);
      setModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Commit failed');
    } finally {
      setSubmitting(false);
    }
  }

  const submitDisabled =
    !customerId ||
    !actionType ||
    !effectiveDate ||
    (!isTermination && !newMrr) ||
    !file ||
    submitting;

  const circuitDisplay = selectedAccount?.circuitId ?? '—';
  const currentMrrDisplay = selectedAccount?.currentMrr ?? '0';
  const currentBandwidthDisplay = selectedAccount?.bandwidthMbps ?? '';

  return (
    <div className="px-8 py-6 max-w-5xl flex flex-col gap-4">
      <PageHeader
        title="Initiate Commercial Change"
        subtitle="Upgrade · Downgrade · Rate Revision · Termination — client approval is mandatory."
      />

      <Card>
        <CardHeader>
          <CardTitle>Compliance Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="text-sm text-gray-600 space-y-1.5 list-decimal list-inside">
            <li>Select customer and circuit, choose action, fill commercials.</li>
            <li>
              <span className="font-semibold text-gray-900">Gate 2 (hard stop):</span>{' '}
              the system will not commit until you upload the client confirmation
              email (.eml / .msg / .pdf).
            </li>
            <li>
              On commit, an Accounts Team draft is auto-generated. Copy-paste into
              your mail client or download as .eml.
            </li>
          </ol>
        </CardContent>
      </Card>

      <form onSubmit={onSubmit}>
        <Card>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="customer">Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger id="customer" className="w-full h-9">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {formatCustomerLabel(account)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="circuit">Circuit</Label>
              <Input
                id="circuit"
                value={circuitDisplay}
                readOnly
                disabled
                className="h-9"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="action">Action Type</Label>
              <Select
                value={actionType}
                onValueChange={(v) => setActionType(v as ActionType)}
              >
                <SelectTrigger id="action" className="w-full h-9">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ACTION_LABELS) as CommitInput['changeType'][]).map(
                    (key) => (
                      <SelectItem key={key} value={key}>
                        {ACTION_LABELS[key]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="effective-date">Effective Date</Label>
              <Input
                id="effective-date"
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="new-bandwidth">New Bandwidth (Mbps)</Label>
              <Input
                id="new-bandwidth"
                type="number"
                inputMode="numeric"
                min={0}
                value={newBandwidthMbps}
                onChange={(e) => setNewBandwidthMbps(e.target.value)}
                placeholder={
                  currentBandwidthDisplay !== ''
                    ? `current ${currentBandwidthDisplay}`
                    : 'e.g. 100'
                }
                disabled={isTermination}
                className="h-9"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="new-mrr">New MRR (₹)</Label>
              <Input
                id="new-mrr"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={isTermination ? '0' : newMrr}
                onChange={(e) => setNewMrr(e.target.value)}
                placeholder={`current ${currentMrrDisplay}`}
                disabled={isTermination}
                className="h-9"
              />
              {isTermination && (
                <p className="text-xs text-gray-500">
                  MRR will be set to ₹0 and the account marked TERMINATED.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Customer capacity expansion ahead of new branch rollout."
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <Card className="border-red-200 bg-red-50/30 ring-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <span
                      className="inline-block w-2 h-2 rounded-full bg-red-500"
                      aria-hidden="true"
                    />
                    Gate 2 — Client Approval Required (HARD STOP)
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="text-sm text-gray-700">
                    Upload the client&apos;s confirmation email (.eml / .msg) or a
                    signed approval (.pdf). The transaction cannot be committed
                    without it.
                  </p>
                  <Input
                    id="approval-file"
                    type="file"
                    accept=".eml,.msg,.pdf"
                    onChange={onFileChange}
                    disabled={submitting}
                    className="h-9 bg-white"
                  />
                  {file && (
                    <p className="text-xs text-gray-600">
                      Selected:{' '}
                      <span className="font-medium text-gray-800">{file.name}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {error && (
              <div className="md:col-span-2">
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}

            <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitDisabled}
                className="bg-brand-600 text-white hover:bg-brand-700"
              >
                {submitting ? 'Committing…' : 'Commit Change'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <EmailDraftModal
        open={modalOpen}
        onOpenChange={onModalOpenChange}
        draft={result?.emailDraft ?? null}
      />
    </div>
  );
}
