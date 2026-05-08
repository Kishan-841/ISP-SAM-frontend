'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Search,
  Loader2,
  ShieldCheck,
  FileSignature,
  ClipboardCheck,
} from 'lucide-react';
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
  const [customerId, setCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [actionType, setActionType] = useState<ActionType>('');
  const [effectiveDate, setEffectiveDate] = useState<string>(todayIso());
  const [newBandwidthMbps, setNewBandwidthMbps] = useState<string>('');
  const [newArc, setNewArc] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [disconnectionCategoryId, setDisconnectionCategoryId] = useState<string>('');
  const [disconnectionSubCategoryId, setDisconnectionSubCategoryId] = useState<string>('');
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
      // Rate revision: bandwidth uplift; ARC neutral or down (per CLAUDE.md §2)
      if (newArcNum !== null && newArcNum > currentArc) {
        arc = `Rate Revision keeps ARC neutral or lower than current ₹${currentArc.toLocaleString('en-IN')}.`;
      }
      if (newBwNum !== null && currentBw !== null && newBwNum < currentBw) {
        bw = `Rate Revision typically uplifts bandwidth — use Downgrade if you're reducing.`;
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
    setApprovalFile(null);
    setPoFile(null);
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
    if (!customerId || !actionType || !effectiveDate || !approvalFile || !poFile) return;
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
        approvalFile,
        poFile,
      };
      if (newBandwidthMbps) payload.newBandwidthMbps = Number(newBandwidthMbps);
      if (reason.trim()) payload.reason = reason.trim();
      if (isTermination) {
        payload.disconnectionCategoryId = disconnectionCategoryId;
        payload.disconnectionSubCategoryId = disconnectionSubCategoryId;
        if (reason.trim()) payload.disconnectionReason = reason.trim();
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
  // 1: ready to upload documents (commercials filled but ≥1 file missing)
  // 2: ready to commit (BOTH approval + PO present)
  const currentStep = (() => {
    if (approvalFile && poFile) return 2;
    const commercialsFilled = customerId && actionType && effectiveDate && (isTermination || newArc);
    return commercialsFilled ? 1 : 0;
  })();

  // A customer that wasn't synced from CRM (no externalCrmId) can't have a
  // service order created on the CRM side — the POST would 400 with
  // 'Customer not found'. Block submission with a clear warning.
  const isCustomerCrmSynced = !!selectedAccount?.externalCrmId;
  const submitDisabled =
    !customerId ||
    !actionType ||
    !effectiveDate ||
    (!isTermination && !newArc) ||
    (isTermination && (!disconnectionCategoryId || !disconnectionSubCategoryId)) ||
    !approvalFile ||
    !poFile ||
    submitting ||
    arcError !== null ||
    bwError !== null ||
    (selectedAccount !== null && !isCustomerCrmSynced);

  const selectedDisconnectionCategory = disconnectionCategories.find(
    (c) => c.id === disconnectionCategoryId,
  );

  // Typeahead filter: matches across name, company, customer code, circuit ID.
  // Empty query → show only the 5 most recent customers (the API already
  // returns them ordered by createdAt desc). Once the operator types, search
  // the full list and cap visible matches at 25 so the dropdown stays scannable.
  const filteredAccounts = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return accounts.slice(0, 5);
    return accounts
      .filter((a) =>
        [a.clientName, a.companyName, a.customerCode, a.circuitId, a.mobileNumber]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      )
      .slice(0, 25);
  }, [accounts, customerSearch]);

  const showRecentHint =
    customerSearch.trim() === '' && accounts.length > filteredAccounts.length;

  function customerLabel(a: Account): string {
    const left = a.companyName || a.clientName;
    return a.customerCode ? `${left} · ${a.customerCode}` : left;
  }

  const currentArcHint = selectedAccount
    ? `Current ARC: ₹${Number(selectedAccount.currentArc).toLocaleString('en-IN')} per year`
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

      {/* Step indicator */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
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
              <FormField label="Effective Date" required>
                <Input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="h-10"
                />
              </FormField>
            </FormSection>

            {selectedAccount && !isCustomerCrmSynced && (
              <div className="px-6 py-4">
                <Alert variant="destructive">
                  <AlertDescription>
                    This customer doesn&apos;t have a CRM external ID — likely imported manually
                    or via Excel. The CRM bridge requires a synced customer; the service-order
                    POST will 400. Re-sync this customer from CRM (or activate a plan in CRM
                    so the customer.activated webhook fires) before raising a commercial change.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {isTermination ? (
              <FormSection
                title="Disconnection details"
                description="The CRM auto-sets the disconnection date to today + 30 days (notice period). Pick a reason from the predefined list — the operator team uses these to track churn drivers."
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
                  label="New ARC (annual ₹)"
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
                    className={`h-10 ${arcError ? 'border-red-300 focus-visible:ring-red-500/20 focus-visible:border-red-500' : ''}`}
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
              description="Both the customer's approval and the Purchase Order are required. They're forwarded to the CRM Docs review."
            >
              <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                <UploadSlot
                  icon={FileSignature}
                  label="Client approval"
                  caption="Customer's email or signed PDF"
                  state={approvalFile ? 'done' : 'pending'}
                  accent="indigo"
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
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  caption: string;
  state: 'pending' | 'done';
  accent: 'indigo' | 'emerald';
  children: React.ReactNode;
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
            Required
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
