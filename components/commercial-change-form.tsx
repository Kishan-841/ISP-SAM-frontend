'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Search,
  Loader2,
  ShieldCheck,
  FileSignature,
  ClipboardCheck,
  Info,
  FlaskConical,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from './page-header';
import { EmailDraftModal } from './email-draft-modal';
import { DisconnectionTimeline } from './disconnection-timeline';
import { FormSection, FormField } from './form-section';
import { FileDropZone } from './file-drop-zone';
import { StepIndicator } from './step-indicator';
import { env } from '../lib/env';
import {
  commitCommercialChange,
  type CommitInput,
  type CommitResult,
  type DisconnectionCategory,
} from '../services/commercial-changes';
import type { Account } from '../services/accounts';

type ActionType = CommitInput['changeType'] | '';

const ACTION_LABELS: Record<CommitInput['changeType'], string> = {
  UPGRADE: 'Upgrade',
  DOWNGRADE: 'Downgrade',
  RATE_REVISION: 'Rate Revision',
  DISCONNECTION: 'Disconnection',
};

const STEPS = ['Fill commercials', 'Upload approval & PO', 'Commit & notify'];

function CustomerOption({ account }: { account: Account }) {
  const arc = Number(account.currentArc);
  const detailParts: string[] = [];
  if (account.bandwidthMbps != null) detailParts.push(`${account.bandwidthMbps} Mbps`);
  if (arc > 0) detailParts.push(`₹${arc.toLocaleString('en-IN')} ARC`);
  if (account.currentPlan) detailParts.push(account.currentPlan);

  return (
    <div className="flex flex-col gap-0.5 py-0.5">
      <div className="flex items-center gap-2 text-sm text-gray-900">
        <span className="font-medium">{account.clientName}</span>
        {account.customerCode && (
          <span className="font-mono text-xs text-brand-600">{account.customerCode}</span>
        )}
        {account.companyName && (
          <span className="text-xs text-gray-500 truncate">· {account.companyName}</span>
        )}
      </div>
      {account.circuitId && (
        <div className="flex items-center gap-1 text-[11px] text-gray-500">
          <span className="uppercase tracking-wider font-medium text-gray-400">Circuit</span>
          <span className="font-mono text-gray-700">{account.circuitId}</span>
        </div>
      )}
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

export function CommercialChangeForm({
  accounts,
  disconnectionCategories = [],
}: {
  accounts: Account[];
  disconnectionCategories?: DisconnectionCategory[];
}) {
  const router = useRouter();
  // Deep-link support — e.g. `?type=RATE_REVISION&customerId=<id>` from the
  // Probable Churn Retain button. We read these on first render so the
  // customer + action type drop into place without any extra effects.
  // Unknown / unauthorised customer ids are silently ignored.
  const searchParams = useSearchParams();
  const [customerId, setCustomerId] = useState<string>(() => {
    const id = searchParams.get('customerId') ?? '';
    return accounts.some((a) => a.id === id) ? id : '';
  });
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [actionType, setActionType] = useState<ActionType>(() => {
    const t = searchParams.get('type');
    return (['UPGRADE', 'DOWNGRADE', 'RATE_REVISION', 'DISCONNECTION'] as const).includes(
      t as never,
    )
      ? (t as ActionType)
      : '';
  });
  const [effectiveDate, setEffectiveDate] = useState<string>(todayIso());
  const [mailReceivedDate, setMailReceivedDate] = useState<string>(todayIso());
  // Test mode runtime toggle. Visible only when the feature flag (env.testMode)
  // is set; default ON so devs can submit without docs straight away.
  const [testModeOn, setTestModeOn] = useState<boolean>(env.testMode);
  const [newBandwidthMbps, setNewBandwidthMbps] = useState<string>('');
  const [newArc, setNewArc] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [disconnectionCategoryId, setDisconnectionCategoryId] = useState<string>('');
  const [disconnectionSubCategoryId, setDisconnectionSubCategoryId] = useState<string>('');
  // Quick-disconnect state. Hidden in UI unless the feature flag is on AND
  // the user selected DISCONNECTION. NORMAL preserves the legacy 21-day flow.
  const [disconnectionMode, setDisconnectionMode] =
    useState<'NORMAL' | 'QUICK'>('NORMAL');
  const [quickRequestedDays, setQuickRequestedDays] = useState<string>('7');
  const [quickApprovalReason, setQuickApprovalReason] = useState<string>('');
  const [approvalFile, setApprovalFile] = useState<File | null>(null);
  const [poFile, setPoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CommitResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === customerId) ?? null,
    [accounts, customerId],
  );

  const isTermination = actionType === 'DISCONNECTION';
  const isRateRevision = actionType === 'RATE_REVISION';

  // Rate revision: ARC must equal current ARC. Auto-fill the input with the
  // current value the moment the customer + action type are both set, so the
  // SAM only has to enter bandwidth.
  useEffect(() => {
    if (isRateRevision && selectedAccount) {
      const current = String(Math.round(Number(selectedAccount.currentArc)));
      setNewArc((prev) => (prev === '' || prev !== current ? current : prev));
    }
  }, [isRateRevision, selectedAccount]);

  // Action-aware client-side validation. Each rule returns null when the input
  // is OK or hasn't been provided yet, and an error string when the value
  // contradicts the chosen action type.
  const { arcError, bwError } = useMemo<{
    arcError: string | null;
    bwError: string | null;
  }>(() => {
    if (!selectedAccount || !actionType || isTermination) {
      return { arcError: null, bwError: null };
    }
    const currentArc = Number(selectedAccount.currentArc);
    const currentBw = selectedAccount.bandwidthMbps ?? null;
    const newArcNum = newArc === '' ? null : Number(newArc);
    const newBwNum = newBandwidthMbps === '' ? null : Number(newBandwidthMbps);

    let arc: string | null = null;
    let bw: string | null = null;

    if (actionType === 'UPGRADE') {
      if (newArcNum !== null && newArcNum <= currentArc) {
        arc = `Upgrade requires New ARC greater than current ₹${currentArc.toLocaleString('en-IN')}.`;
      }
      if (newBwNum !== null && currentBw !== null && newBwNum <= currentBw) {
        bw = `Upgrade requires New Bandwidth greater than current ${currentBw} Mbps.`;
      }
    } else if (actionType === 'DOWNGRADE') {
      if (newArcNum !== null && newArcNum >= currentArc) {
        arc = `Downgrade requires New ARC less than current ₹${currentArc.toLocaleString('en-IN')}.`;
      }
      if (newBwNum !== null && currentBw !== null && newBwNum > currentBw) {
        bw = `Downgrade can't increase bandwidth — use Upgrade or Rate Revision instead.`;
      }
    } else if (actionType === 'RATE_REVISION') {
      // Rate revision: bandwidth uplift at SAME ARC. Customer pays the same
      // money but gets more speed — typically a renewal sweetener or a
      // competitor-match move.
      if (newArcNum !== null && newArcNum !== currentArc) {
        arc = `Rate Revision keeps ARC the same as current ₹${currentArc.toLocaleString('en-IN')} — only bandwidth changes.`;
      }
      if (newBwNum !== null && currentBw !== null && newBwNum <= currentBw) {
        bw = `Rate Revision requires New Bandwidth greater than current ${currentBw} Mbps.`;
      }
    }

    return { arcError: arc, bwError: bw };
  }, [selectedAccount, actionType, isTermination, newArc, newBandwidthMbps]);

  function resetForm() {
    setCustomerId('');
    setCustomerSearch('');
    setSearchOpen(false);
    setActionType('');
    setEffectiveDate(todayIso());
    setNewBandwidthMbps('');
    setNewArc('');
    setReason('');
    setDisconnectionCategoryId('');
    setDisconnectionSubCategoryId('');
    setDisconnectionMode('NORMAL');
    setQuickRequestedDays('7');
    setQuickApprovalReason('');
    setApprovalFile(null);
    setPoFile(null);
    setError(null);
  }

  function onModalOpenChange(open: boolean) {
    setModalOpen(open);
    if (!open) {
      // For disconnection commits, keep `result` populated so the inline
      // timeline panel stays visible after the email-draft modal dismisses.
      // The timeline's "Raise another change" button is what clears it.
      const isDisconnection = result?.commercialChange.changeType === 'DISCONNECTION';
      if (!isDisconnection) {
        setResult(null);
        resetForm();
      }
    }
  }

  function dismissTimelineAndReset() {
    setResult(null);
    resetForm();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    // Document gate: at least ONE of approval / PO must be attached. Bypass
    // when the runtime test-mode toggle is on (and env.testMode enabled it).
    if (
      !customerId ||
      !actionType ||
      !effectiveDate ||
      !mailReceivedDate ||
      (!approvalFile && !poFile && !testModeOn)
    )
      return;
    if (!isTermination && !newArc) return;
    if (isTermination && (!disconnectionCategoryId || !disconnectionSubCategoryId)) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: CommitInput = {
        accountId: customerId,
        changeType: actionType,
        newArc: isTermination ? 0 : Number(newArc),
        effectiveDate,
        mailReceivedDate,
        approvalFile,
        poFile,
        testMode: testModeOn,
      };
      if (newBandwidthMbps) payload.newBandwidthMbps = Number(newBandwidthMbps);
      if (reason.trim()) payload.reason = reason.trim();
      if (isTermination) {
        payload.disconnectionCategoryId = disconnectionCategoryId;
        payload.disconnectionSubCategoryId = disconnectionSubCategoryId;
        if (reason.trim()) payload.disconnectionReason = reason.trim();
        if (env.quickDisconnectEnabled) {
          payload.disconnectionMode = disconnectionMode;
          if (disconnectionMode === 'QUICK') {
            payload.quickRequestedDays = Number(quickRequestedDays);
            payload.quickApprovalReason = quickApprovalReason.trim();
          }
        }
      }

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
  // 0: filling commercials (no files yet, customer/action partially filled)
  // 1: ready to upload at least one document
  // 2: ready to commit (≥1 document attached)
  const currentStep = (() => {
    if (approvalFile || poFile) return 2;
    const commercialsFilled = customerId && actionType && effectiveDate && (isTermination || newArc);
    // In test mode the doc step is bypassed — once commercials are filled
    // the form is already at the "ready to commit" step.
    if (commercialsFilled && testModeOn) return 2;
    return commercialsFilled ? 1 : 0;
  })();

  // A customer that wasn't synced from CRM (no externalCrmId) — typically
  // imported via Excel — has no CRM service-order workflow. The backend
  // applies the change to the account row immediately on commit. The form
  // surfaces an info note in place of a block.
  const isCustomerCrmSynced = !!selectedAccount?.externalCrmId;

  // Lifecycle guards — keep the SAM and CRM sides in sync. Backend will 422
  // these too, but blocking in the form gives operators an immediate signal
  // instead of waiting for the submit round-trip.
  const accountStatus = selectedAccount?.contractStatus;
  const isAccountTerminated = accountStatus === 'TERMINATED';
  const isAccountDisconnecting = accountStatus === 'DISCONNECTING';
  const isAccountProbableChurn = accountStatus === 'PROBABLE_CHURN';
  const lifecycleBlocked = isAccountTerminated || isAccountDisconnecting;
  const disconnectionBlocked = isAccountProbableChurn && isTermination;

  // Quick-disconnect gate. Only validated when the feature is on AND the
  // user picked QUICK on a DISCONNECTION row.
  const isQuickDisconnect =
    env.quickDisconnectEnabled && isTermination && disconnectionMode === 'QUICK';
  const quickDaysNumber = Number(quickRequestedDays);
  const quickDaysInvalid =
    isQuickDisconnect &&
    (quickRequestedDays === '' ||
      !Number.isInteger(quickDaysNumber) ||
      quickDaysNumber < 0 ||
      quickDaysNumber > 15);
  const quickReasonTooShort =
    isQuickDisconnect && quickApprovalReason.trim().length < 10;

  const submitDisabled =
    !customerId ||
    !actionType ||
    !effectiveDate ||
    !mailReceivedDate ||
    (!isTermination && !newArc) ||
    (isTermination && (!disconnectionCategoryId || !disconnectionSubCategoryId)) ||
    quickDaysInvalid ||
    quickReasonTooShort ||
    // Documents — at least one of approval / PO must be attached (skipped
    // when the runtime test-mode toggle is on).
    (!approvalFile && !poFile && !testModeOn) ||
    submitting ||
    arcError !== null ||
    bwError !== null ||
    lifecycleBlocked ||
    disconnectionBlocked;

  const selectedDisconnectionCategory = disconnectionCategories.find(
    (c) => c.id === disconnectionCategoryId,
  );

  // Lifecycle filter — customers in TERMINATED / DISCONNECTING state can't
  // have any further commercial changes raised (backend rejects with 422).
  // Hide them from the typeahead entirely so the operator can't even pick
  // them. PROBABLE_CHURN stays visible because a rate-revision auto-retains.
  const selectableAccounts = useMemo(
    () =>
      accounts.filter(
        (a) => a.contractStatus !== 'TERMINATED' && a.contractStatus !== 'DISCONNECTING',
      ),
    [accounts],
  );

  // Typeahead filter: matches across name, company, customer code, circuit ID.
  // Empty query → show only the 5 most recent customers (the API already
  // returns them ordered by createdAt desc). Once the operator types, search
  // the full list and cap visible matches at 25 so the dropdown stays scannable.
  const filteredAccounts = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return selectableAccounts.slice(0, 5);
    return selectableAccounts
      .filter((a) =>
        [a.clientName, a.companyName, a.customerCode, a.circuitId, a.mobileNumber]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      )
      .slice(0, 25);
  }, [selectableAccounts, customerSearch]);

  const showRecentHint =
    customerSearch.trim() === '' && selectableAccounts.length > filteredAccounts.length;

  function customerLabel(a: Account): string {
    const left = a.companyName || a.clientName;
    return a.customerCode ? `${left} · ${a.customerCode}` : left;
  }

  const currentArcHint = selectedAccount
    ? isRateRevision
      ? `Locked at current ₹${Number(selectedAccount.currentArc).toLocaleString('en-IN')} — rate revision keeps ARC the same`
      : `Current ARC: ₹${Number(selectedAccount.currentArc).toLocaleString('en-IN')} per year`
    : 'Select a customer first';
  const currentBandwidthHint = selectedAccount
    ? selectedAccount.bandwidthMbps != null
      ? `Current bandwidth: ${selectedAccount.bandwidthMbps} Mbps`
      : 'No current bandwidth recorded'
    : 'Select a customer first';

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl flex flex-col gap-6">
      <PageHeader
        title="Initiate Commercial Change"
        subtitle="Upgrade · Downgrade · Rate Revision · Disconnection — client approval is mandatory."
      />

      {env.testMode && (
        <div
          className={`flex items-center gap-3 rounded-md border px-4 py-3 transition-[background-color,border-color] duration-200 ease-[var(--ease-out)] ${
            testModeOn
              ? 'border-amber-300 bg-amber-50 text-amber-900'
              : 'border-gray-200 bg-white text-gray-700'
          }`}
        >
          <FlaskConical
            className={`h-5 w-5 shrink-0 ${testModeOn ? 'text-amber-700' : 'text-gray-400'}`}
          />
          <div className="flex flex-col gap-0.5 leading-tight flex-1 min-w-0">
            <span className="text-sm font-semibold uppercase tracking-wider">Test mode</span>
            <span className="text-xs">
              {testModeOn
                ? 'On — document upload is bypassed. Commits stamp testMode:true in the audit log.'
                : 'Off — document upload required. Toggle on to bypass for testing.'}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={testModeOn}
            aria-label="Toggle test mode"
            onClick={() => setTestModeOn((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-[var(--ease-out)] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
              testModeOn ? 'bg-amber-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-[var(--ease-out)] ${
                testModeOn ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      )}

      {/* Step indicator */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
        <CardContent className="pt-6">
          <StepIndicator steps={STEPS} currentIndex={currentStep} />
        </CardContent>
      </Card>

      {result?.commercialChange.changeType === 'DISCONNECTION' ? (
        <DisconnectionTimeline
          customerName={
            selectedAccount?.companyName || selectedAccount?.clientName || 'this customer'
          }
          customerNoticeDateIso={result.commercialChange.effectiveDate}
          accountId={result.commercialChange.accountId}
          onRaiseAnother={dismissTimelineAndReset}
          mode={result.crm.ok === 'pending-quick-approval' ? 'QUICK' : 'NORMAL'}
          quickRequestedDays={
            result.crm.ok === 'pending-quick-approval' ? Number(quickRequestedDays) : undefined
          }
          quickApprovalReason={
            result.crm.ok === 'pending-quick-approval' ? quickApprovalReason.trim() : undefined
          }
        />
      ) : (
      <form onSubmit={onSubmit}>
        <Card>
          <CardContent className="px-6 pt-6 pb-0 divide-y divide-gray-100">
            <FormSection
              title="Customer & action"
              description="Pick the affected customer and the type of commercial change you're recording."
            >
              <FormField label="Customer" required fullWidth>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Input
                      value={selectedAccount ? customerLabel(selectedAccount) : customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setCustomerId('');
                        setSearchOpen(true);
                      }}
                      onFocus={() => setSearchOpen(true)}
                      onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                      placeholder="Search by name, company, customer code, circuit ID, mobile"
                      className="pl-9 h-12"
                    />
                  </div>
                  {searchOpen && filteredAccounts.length > 0 && (
                    <div className="absolute z-50 left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto">
                      {showRecentHint && (
                        <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold text-gray-500 bg-gray-50 border-b border-gray-100">
                          Latest {filteredAccounts.length} · type to search all {accounts.length}
                        </div>
                      )}
                      {filteredAccounts.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setCustomerId(a.id);
                            setCustomerSearch('');
                            setSearchOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-orange-50 border-b border-gray-100 last:border-b-0"
                        >
                          <CustomerOption account={a} />
                        </button>
                      ))}
                    </div>
                  )}
                  {searchOpen &&
                    customerSearch.trim().length > 0 &&
                    filteredAccounts.length === 0 && (
                      <div className="absolute z-50 left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg px-3 py-3 text-sm text-gray-500">
                        No matches.
                      </div>
                    )}
                </div>
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
              <FormField
                label={isTermination ? 'Customer notice date' : 'Effective Date'}
                required
                hint={
                  isTermination
                    ? 'The day the customer notified you they want to disconnect. This starts the 21-day retention window — service stays live until you proceed.'
                    : undefined
                }
              >
                <Input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="h-10"
                />
              </FormField>
              <FormField
                label="Mail Received Date"
                required
                hint="Date the customer's approval email landed in your inbox."
              >
                <Input
                  type="date"
                  value={mailReceivedDate}
                  onChange={(e) => setMailReceivedDate(e.target.value)}
                  max={todayIso()}
                  className="h-10"
                />
              </FormField>
            </FormSection>

            {isAccountTerminated && (
              <div className="px-6 py-4">
                <Alert variant="destructive">
                  <AlertDescription>
                    This customer has been <strong>disconnected</strong>. No further commercial
                    changes can be raised — both SAM and CRM are closed on this account. Pick a
                    different customer.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {isAccountDisconnecting && (
              <div className="px-6 py-4">
                <Alert variant="destructive">
                  <AlertDescription>
                    This customer is in the <strong>10-day disconnection notice</strong>. No
                    further changes can be raised — the account will terminate automatically
                    when the notice expires. Escalate to SAM_HEAD / ADMIN if the customer wants
                    to stay.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {disconnectionBlocked && (
              <div className="px-6 py-4">
                <Alert variant="destructive">
                  <AlertDescription>
                    A disconnection is <strong>already in the 21-day retention window</strong> for
                    this customer. Either retain via a rate revision or wait for the day-21
                    prompt on the{' '}
                    <a href="/probable-churn" className="underline">Probable Churn</a> queue.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {isAccountProbableChurn && !isTermination && (
              <div className="px-6 py-4">
                <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                  <div className="leading-relaxed">
                    This customer is in the <strong>21-day retention window</strong>. Submitting
                    this change will auto-cancel the pending disconnection (RETAIN) and the
                    customer goes back to active.
                  </div>
                </div>
              </div>
            )}

            {selectedAccount && !isCustomerCrmSynced && !lifecycleBlocked && (
              <div className="px-6 py-4">
                <div className="flex gap-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm text-sky-900">
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-sky-600" />
                  <div className="leading-relaxed">
                    This customer was imported (no CRM external ID), so there&apos;s no CRM
                    service-order to raise. The change will apply to the account immediately on
                    save and show up on the Existing Base dashboard right away.
                  </div>
                </div>
              </div>
            )}

            {isTermination && env.quickDisconnectEnabled && (
              <FormSection
                title="Disconnection type"
                description="Normal goes through the standard 21-day retention window. Quick skips retention — needs CRM Admin approval and a justification."
              >
                <FormField label="Type" required fullWidth>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label
                      className={`flex-1 flex items-start gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors ${
                        disconnectionMode === 'NORMAL'
                          ? 'border-brand-300 bg-orange-50/40 ring-1 ring-brand-200'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="disconnectionMode"
                        value="NORMAL"
                        checked={disconnectionMode === 'NORMAL'}
                        onChange={() => setDisconnectionMode('NORMAL')}
                        className="mt-1 w-4 h-4 accent-brand-600"
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-gray-900">Normal — 31 days</span>
                        <span className="text-xs text-gray-600">
                          21-day retention window opens, then a 10-day CRM notice. SAM can retain
                          any time before day 21.
                        </span>
                      </div>
                    </label>
                    <label
                      className={`flex-1 flex items-start gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors ${
                        disconnectionMode === 'QUICK'
                          ? 'border-amber-300 bg-amber-50/40 ring-1 ring-amber-200'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="disconnectionMode"
                        value="QUICK"
                        checked={disconnectionMode === 'QUICK'}
                        onChange={() => setDisconnectionMode('QUICK')}
                        className="mt-1 w-4 h-4 accent-amber-600"
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-gray-900">
                          Quick — up to 15 days
                        </span>
                        <span className="text-xs text-gray-600">
                          Skip retention. Needs CRM Admin approval. Termination happens on the day
                          you pick after approval lands.
                        </span>
                      </div>
                    </label>
                  </div>
                </FormField>
                {disconnectionMode === 'QUICK' && (
                  <>
                    <FormField
                      label="Termination after approval"
                      required
                      hint="Days from approval to actual termination. 0–15. 0 = terminate immediately on approval."
                    >
                      <Input
                        type="number"
                        min={0}
                        max={15}
                        step={1}
                        value={quickRequestedDays}
                        onChange={(e) => setQuickRequestedDays(e.target.value)}
                        className="h-10 w-32"
                      />
                    </FormField>
                    <FormField
                      label="Why does this need to skip retention?"
                      required
                      fullWidth
                      hint="Shown to CRM Admin verbatim on the approval queue. Minimum 10 characters."
                    >
                      <Textarea
                        value={quickApprovalReason}
                        onChange={(e) => setQuickApprovalReason(e.target.value)}
                        placeholder="e.g. Customer already shut down operations on 12 May; payment failed twice; account-level fraud flagged."
                        rows={3}
                      />
                      {quickReasonTooShort && quickApprovalReason.length > 0 && (
                        <p className="text-xs text-amber-700 mt-1">
                          {10 - quickApprovalReason.trim().length} more characters required.
                        </p>
                      )}
                    </FormField>
                  </>
                )}
              </FormSection>
            )}

            {isTermination ? (
              <FormSection
                title="Disconnection details"
                description="Pick a reason from the predefined list — the operator team uses these to track churn drivers."
              >
                <FormField label="Reason category" required>
                  <Select
                    value={disconnectionCategoryId}
                    onValueChange={(v) => {
                      setDisconnectionCategoryId(v);
                      setDisconnectionSubCategoryId('');
                    }}
                  >
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {disconnectionCategories
                        .filter((c) => c.isActive)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Sub-category" required>
                  <Select
                    value={disconnectionSubCategoryId}
                    onValueChange={setDisconnectionSubCategoryId}
                    disabled={!selectedDisconnectionCategory}
                  >
                    <SelectTrigger className="w-full h-10">
                      <SelectValue
                        placeholder={
                          selectedDisconnectionCategory
                            ? 'Select sub-category'
                            : 'Pick a category first'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedDisconnectionCategory?.subCategories ?? [])
                        .filter((s) => s.isActive)
                        .map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField
                  label="Notes"
                  fullWidth
                  hint="Free-text. Forwarded to the CRM as the disconnection reason. Visible to the Accounts Team."
                >
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Office shutting down — moving to fiber from another ISP."
                    rows={3}
                  />
                </FormField>
                {disconnectionCategories.length === 0 && (
                  <div className="sm:col-span-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    Disconnection reasons couldn&apos;t be loaded from CRM. The
                    SAM-side commercial change will save, but the CRM service-order
                    creation will fail without category/sub-category. Ask the CRM
                    team if the bridge is up.
                  </div>
                )}
              </FormSection>
            ) : (
              <FormSection
                title="Commercials"
                description="The new bandwidth and ARC after this change takes effect."
              >
                <FormField
                  label="New Bandwidth (Mbps)"
                  hint={currentBandwidthHint}
                  error={bwError}
                >
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={newBandwidthMbps}
                    onChange={(e) => setNewBandwidthMbps(e.target.value)}
                    placeholder="e.g. 100"
                    className={`h-10 ${bwError ? 'border-red-300 focus-visible:ring-red-500/20 focus-visible:border-red-500' : ''}`}
                    aria-invalid={bwError ? true : undefined}
                  />
                </FormField>
                <FormField
                  label={isRateRevision ? 'New ARC (locked)' : 'New ARC (annual ₹)'}
                  required
                  hint={currentArcHint}
                  error={arcError}
                >
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="1"
                    value={newArc}
                    onChange={(e) => setNewArc(e.target.value)}
                    placeholder="e.g. 1000000 (₹10L per year)"
                    readOnly={isRateRevision}
                    disabled={isRateRevision}
                    className={`h-10 ${
                      arcError
                        ? 'border-red-300 focus-visible:ring-red-500/20 focus-visible:border-red-500'
                        : isRateRevision
                          ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
                          : ''
                    }`}
                    aria-invalid={arcError ? true : undefined}
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
            )}

            <FormSection
              title="Documents"
              description="Attach at least one document — client approval or Purchase Order. Both is preferred and forwarded to the CRM Docs review."
            >
              <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                <UploadSlot
                  icon={FileSignature}
                  label="Client approval"
                  caption="Customer's email or signed PDF"
                  state={approvalFile ? 'done' : 'pending'}
                  accent="indigo"
                  optional
                >
                  <FileDropZone
                    accept=".eml,.msg,.pdf"
                    file={approvalFile}
                    onFileChange={setApprovalFile}
                    helper=".eml, .msg or .pdf · up to 10 MB"
                    disabled={submitting}
                  />
                </UploadSlot>
                <UploadSlot
                  icon={ClipboardCheck}
                  label="Purchase Order"
                  caption="Customer's PO document"
                  state={poFile ? 'done' : 'pending'}
                  accent="emerald"
                  optional
                >
                  <FileDropZone
                    accept=".eml,.msg,.pdf"
                    file={poFile}
                    onFileChange={setPoFile}
                    helper=".eml, .msg or .pdf · up to 10 MB"
                    disabled={submitting}
                  />
                </UploadSlot>
              </div>
              {!approvalFile && !poFile && !testModeOn && (
                <p className="sm:col-span-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  Attach at least one of the two to proceed.
                </p>
              )}
              {!approvalFile && !poFile && testModeOn && (
                <p className="sm:col-span-2 text-xs text-amber-800 bg-amber-50 border border-amber-300 rounded-md px-3 py-2">
                  <FlaskConical className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                  Test mode is on — submitting without any attachment is allowed.
                </p>
              )}
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
              className="bg-brand-600 text-white hover:bg-brand-700 min-w-[180px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Committing…
                </>
              ) : (
                <>
                  Commit Change
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
      )}

      <EmailDraftModal
        open={modalOpen}
        onOpenChange={onModalOpenChange}
        draft={result?.emailDraft ?? null}
        changeType={result?.commercialChange.changeType ?? null}
        clientName={selectedAccount?.clientName ?? null}
        crm={result?.crm ?? null}
      />
      </div>
    </div>
  );
}

const UPLOAD_ACCENTS: Record<
  'indigo' | 'emerald',
  { iconBg: string; iconColor: string; doneBg: string; doneText: string; ring: string }
> = {
  indigo: {
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    doneBg: 'bg-indigo-50',
    doneText: 'text-indigo-700',
    ring: 'ring-indigo-100',
  },
  emerald: {
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    doneBg: 'bg-emerald-50',
    doneText: 'text-emerald-700',
    ring: 'ring-emerald-100',
  },
};

function UploadSlot({
  icon: Icon,
  label,
  caption,
  state,
  accent,
  children,
  optional = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  caption: string;
  state: 'pending' | 'done';
  accent: 'indigo' | 'emerald';
  children: React.ReactNode;
  /** When true, the pending pill reads "Optional" instead of "Required". */
  optional?: boolean;
}) {
  const a = UPLOAD_ACCENTS[accent];
  return (
    <div
      className={`bg-white rounded-xl ring-1 ${a.ring} shadow-sm p-4 flex flex-col gap-3`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-lg ${a.iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 ${a.iconColor}`} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900">{label}</div>
            <div className="text-xs text-gray-500 truncate">{caption}</div>
          </div>
        </div>
        {state === 'done' ? (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${a.doneBg} ${a.doneText}`}>
            <ShieldCheck className="w-3 h-3" />
            Attached
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-gray-100 text-gray-500">
            {optional ? 'Optional' : 'Required'}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
