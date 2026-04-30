'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from './page-header';
import { EmailDraftModal } from './email-draft-modal';
import { FormSection, FormField } from './form-section';
import { FileDropZone } from './file-drop-zone';
import { StepIndicator } from './step-indicator';
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

const STEPS = ['Fill commercials', 'Upload approval', 'Commit & notify'];

function CustomerOption({ account }: { account: Account }) {
  const mrr = Number(account.currentMrr);
  const detailParts: string[] = [];
  if (account.bandwidthMbps != null) detailParts.push(`${account.bandwidthMbps} Mbps`);
  if (mrr > 0) detailParts.push(`₹${mrr.toLocaleString('en-IN')}/mo`);
  if (account.currentPlan) detailParts.push(account.currentPlan);

  return (
    <div className="flex flex-col gap-0.5 py-0.5">
      <div className="flex items-center gap-2 text-sm text-gray-900">
        <span className="font-medium">{account.clientName}</span>
        {account.customerCode && (
          <span className="font-mono text-xs text-brand-600">{account.customerCode}</span>
        )}
      </div>
      {detailParts.length > 0 && (
        <div className="text-xs text-gray-500">{detailParts.join(' · ')}</div>
      )}
    </div>
  );
}

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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

  function onModalOpenChange(open: boolean) {
    setModalOpen(open);
    if (!open) {
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

  // Step indicator: which step is the user "in"?
  // 0: filling commercials (no file yet, customer/action partially filled)
  // 1: ready to upload approval (commercials filled but no file)
  // 2: ready to commit (file present)
  const currentStep = (() => {
    if (file) return 2;
    const commercialsFilled = customerId && actionType && effectiveDate && (isTermination || newMrr);
    return commercialsFilled ? 1 : 0;
  })();

  const submitDisabled =
    !customerId ||
    !actionType ||
    !effectiveDate ||
    (!isTermination && !newMrr) ||
    !file ||
    submitting;

  const currentMrrHint = selectedAccount
    ? `Current MRR: ₹${Number(selectedAccount.currentMrr).toLocaleString('en-IN')}`
    : 'Select a customer first';
  const currentBandwidthHint = selectedAccount
    ? selectedAccount.bandwidthMbps != null
      ? `Current bandwidth: ${selectedAccount.bandwidthMbps} Mbps`
      : 'No current bandwidth recorded'
    : 'Select a customer first';

  return (
    <div className="px-8 py-6 max-w-5xl flex flex-col gap-6">
      <PageHeader
        title="Initiate Commercial Change"
        subtitle="Upgrade · Downgrade · Rate Revision · Termination — client approval is mandatory."
      />

      {/* Step indicator */}
      <Card>
        <CardContent className="pt-6">
          <StepIndicator steps={STEPS} currentIndex={currentStep} />
        </CardContent>
      </Card>

      <form onSubmit={onSubmit}>
        <Card>
          <CardContent className="px-6 pt-6 pb-0 divide-y divide-gray-100">
            <FormSection
              title="Customer & action"
              description="Pick the affected customer and the type of commercial change you're recording."
            >
              <FormField label="Customer" required fullWidth>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className="w-full h-12">
                    <SelectValue placeholder="Select customer">
                      {selectedAccount && (
                        <span className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-900">{selectedAccount.clientName}</span>
                          {selectedAccount.customerCode && (
                            <span className="font-mono text-xs text-brand-600">
                              {selectedAccount.customerCode}
                            </span>
                          )}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        <CustomerOption account={a} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Circuit" hint="Auto-derived from the selected customer">
                <Input
                  value={selectedAccount?.circuitId ?? '—'}
                  readOnly
                  disabled
                  className="h-10"
                />
              </FormField>
              <FormField label="Action Type" required>
                <Select value={actionType} onValueChange={(v) => setActionType(v as ActionType)}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ACTION_LABELS) as CommitInput['changeType'][]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {ACTION_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Effective Date" required>
                <Input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="h-10"
                />
              </FormField>
            </FormSection>

            <FormSection
              title="Commercials"
              description="The new bandwidth and MRR after this change takes effect. For terminations, MRR is set to ₹0 automatically."
            >
              <FormField label="New Bandwidth (Mbps)" hint={currentBandwidthHint}>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={newBandwidthMbps}
                  onChange={(e) => setNewBandwidthMbps(e.target.value)}
                  placeholder="e.g. 100"
                  disabled={isTermination}
                  className="h-10"
                />
              </FormField>
              <FormField
                label="New MRR (₹)"
                required={!isTermination}
                hint={isTermination ? 'Forced to ₹0 for terminations' : currentMrrHint}
              >
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={isTermination ? '0' : newMrr}
                  onChange={(e) => setNewMrr(e.target.value)}
                  placeholder="0"
                  disabled={isTermination}
                  className="h-10"
                />
              </FormField>
              <FormField label="Reason" fullWidth hint="Why is this change happening? Visible in the audit log.">
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Customer capacity expansion ahead of new branch rollout."
                  rows={3}
                />
              </FormField>
            </FormSection>

            <FormSection
              title="Approval"
              description="The client's confirmation is the hard gate. Without it, the system will refuse the commit."
            >
              <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50/50 p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-semibold">Gate 2 — Client Approval Required (HARD STOP)</span>
                </div>
                <p className="text-sm text-red-800/80">
                  Upload the client&apos;s confirmation email (.eml / .msg) or a signed approval (.pdf).
                  The transaction cannot be committed without it.
                </p>
                <FileDropZone
                  accept=".eml,.msg,.pdf"
                  file={file}
                  onFileChange={setFile}
                  helper=".eml, .msg or .pdf · up to 10 MB"
                  disabled={submitting}
                />
              </div>
            </FormSection>

            {error && (
              <div className="py-4">
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>

          {/* Sticky-feel footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-xl">
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
              size="lg"
              className="bg-brand-600 text-white hover:bg-brand-700"
            >
              {submitting ? 'Committing…' : 'Commit Change'}
              {!submitting && <ArrowRight className="w-4 h-4 ml-1.5" />}
            </Button>
          </div>
        </Card>
      </form>

      <EmailDraftModal
        open={modalOpen}
        onOpenChange={onModalOpenChange}
        draft={result?.emailDraft ?? null}
        changeType={result?.commercialChange.changeType ?? null}
        clientName={selectedAccount?.clientName ?? null}
      />
    </div>
  );
}
