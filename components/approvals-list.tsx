'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Inbox,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable, type Column } from './data-table';
import { StatusPill, type PillTone } from './status-pill';
import { toast } from 'sonner';
import {
  approvalDecision,
  type ApprovalStatus,
  type ChangeType,
  type PendingApproval,
} from '../services/commercial-changes';
import { formatRupees } from '../lib/format-rupees';

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : DATE_FMT.format(d);
}

const CHANGE_LABEL: Record<ChangeType, string> = {
  UPGRADE: 'Upgrade',
  DOWNGRADE: 'Downgrade',
  RATE_REVISION: 'Rate Revision',
  DISCONNECTION: 'Disconnection',
};

const CHANGE_TONE: Record<ChangeType, PillTone> = {
  UPGRADE: 'emerald',
  DOWNGRADE: 'amber',
  RATE_REVISION: 'purple',
  DISCONNECTION: 'red',
};

const STAGE_META: Partial<Record<ApprovalStatus, { tone: PillTone; label: string }>> = {
  PENDING_SUPER_ADMIN_2: { tone: 'amber', label: 'Super Admin 2' },
  PENDING_SAM_HEAD: { tone: 'amber', label: 'SAM Head' },
  PENDING_ACCOUNTS: { tone: 'blue', label: 'Accounts' },
};

type Decision = { item: PendingApproval; action: 'APPROVE' | 'REJECT' };

export function ApprovalsList({ items }: { items: PendingApproval[] }) {
  const [decision, setDecision] = useState<Decision | null>(null);

  const columns: Column<PendingApproval>[] = [
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      cell: (c) => (
        <div className="flex flex-col">
          <Link
            href={`/customers/${c.account.id}/details`}
            className="text-sm font-medium text-gray-900 hover:text-brand-600"
            onClick={(e) => e.stopPropagation()}
          >
            {c.account.companyName || c.account.clientName}
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            {c.account.customerCode && (
              <span className="font-mono text-xs text-brand-600">{c.account.customerCode}</span>
            )}
            {c.account.circuitId && (
              <span className="inline-flex items-center gap-0.5 font-mono text-xs text-gray-400">
                <Wifi className="w-3 h-3" />
                {c.account.circuitId}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      align: 'center',
      cell: (c) => (
        <div className="inline-flex items-center gap-1.5">
          <StatusPill tone={CHANGE_TONE[c.changeType]}>{CHANGE_LABEL[c.changeType]}</StatusPill>
          {c.disconnectionMode === 'QUICK' && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 ring-1 ring-amber-200"
              title="Quick termination — bypasses the 21-day retention window"
            >
              <Zap className="w-2.5 h-2.5" />
              Quick
            </span>
          )}
        </div>
      ),
      className: 'px-5 py-4 text-center whitespace-nowrap',
    },
    {
      key: 'change',
      header: 'Change',
      align: 'center',
      cell: (c) =>
        c.changeType === 'DISCONNECTION' ? (
          <div className="flex items-center justify-center gap-1.5 text-sm tabular-nums whitespace-nowrap">
            <span className="font-semibold text-red-600">{formatRupees(c.oldArc)}</span>
            {c.disconnectionMode === 'QUICK' && c.quickRequestedDays != null && (
              <span className="text-xs text-red-600">· {c.quickRequestedDays}d</span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5 text-sm tabular-nums whitespace-nowrap">
            <span className="text-gray-500">{formatRupees(c.oldArc)}</span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-semibold text-brand-600">{formatRupees(c.newArc)}</span>
          </div>
        ),
      className: 'px-5 py-4 text-center whitespace-nowrap',
    },
    {
      key: 'stage',
      header: 'Waiting on',
      align: 'center',
      cell: (c) => {
        const meta = STAGE_META[c.approvalStatus];
        return meta ? <StatusPill tone={meta.tone}>{meta.label}</StatusPill> : <span>—</span>;
      },
      className: 'px-5 py-4 text-center whitespace-nowrap',
    },
    {
      key: 'raisedBy',
      header: 'Raised by',
      align: 'center',
      cell: (c) => (
        <span className="text-sm text-gray-700">{c.account.samOwner?.name ?? 'Unassigned'}</span>
      ),
      className: 'px-5 py-4 text-center whitespace-nowrap',
    },
    {
      key: 'requestedAt',
      header: 'Requested',
      align: 'center',
      sortable: true,
      cell: (c) => <span className="text-sm text-gray-500">{fmtDate(c.requestedAt)}</span>,
      className: 'px-5 py-4 text-center whitespace-nowrap',
    },
    {
      key: 'docs',
      header: 'Docs',
      align: 'center',
      cell: (c) => (
        <div className="flex items-center justify-center gap-2">
          {c.approvalFileUrl && (
            <a
              href={`/api/commercial-changes/${c.id}/file/approval`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
            >
              <FileText className="w-3 h-3" /> Approval
            </a>
          )}
          {c.poFileUrl && (
            <a
              href={`/api/commercial-changes/${c.id}/file/po`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
            >
              <FileText className="w-3 h-3" /> PO
            </a>
          )}
          {!c.approvalFileUrl && !c.poFileUrl && <span className="text-xs text-gray-400">—</span>}
        </div>
      ),
      className: 'px-5 py-4 text-center whitespace-nowrap',
    },
  ];

  return (
    <>
      <DataTable<PendingApproval>
        columns={columns}
        rows={items}
        rowKey={(c) => c.id}
        searchable
        searchPlaceholder="Search by customer, code, circuit"
        searchKeys={['account.clientName', 'account.companyName', 'account.customerCode', 'account.circuitId']}
        pagination
        actions={(c) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              className="h-8 bg-emerald-600 hover:bg-emerald-700 gap-1"
              onClick={() => setDecision({ item: c, action: 'APPROVE' })}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300 gap-1"
              onClick={() => setDecision({ item: c, action: 'REJECT' })}
            >
              <X className="w-3.5 h-3.5" />
              Reject
            </Button>
          </div>
        )}
        emptyTitle="All clear"
        emptySubtitle="No commercial changes are awaiting your approval right now."
        emptyIcon={Inbox}
        minWidth="min-w-[1080px]"
      />

      {decision && (
        <DecisionDialog decision={decision} onClose={() => setDecision(null)} />
      )}
    </>
  );
}

function DecisionDialog({ decision, onClose }: { decision: Decision; onClose: () => void }) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [materialRecovered, setMaterialRecovered] = useState(true);
  const [materialNotes, setMaterialNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  const { item, action } = decision;
  const isReject = action === 'REJECT';
  const name = item.account.companyName || item.account.clientName;
  const typeLabel = CHANGE_LABEL[item.changeType];
  const reasonMissing = isReject && reason.trim().length < 3;

  const isDisconnection = item.changeType === 'DISCONNECTION';
  // Terminal = the approval that actually does something. ACCOUNTS is terminal
  // for non-disconnections; SUPER_ADMIN_2 is the final gate on disconnections.
  const isTerminal =
    item.approvalStatus === 'PENDING_SUPER_ADMIN_2' ||
    (item.approvalStatus === 'PENDING_ACCOUNTS' && !isDisconnection);
  // Material recovery is captured only on that final disconnection gate.
  const showMaterial =
    !isReject && isDisconnection && item.approvalStatus === 'PENDING_SUPER_ADMIN_2';

  async function confirm() {
    if (reasonMissing) {
      setError('A reason is required to reject.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await approvalDecision(
        item.id,
        action,
        reason.trim() || undefined,
        showMaterial
          ? { recovered: materialRecovered, notes: materialNotes.trim() || undefined }
          : undefined,
      );
      toast.success(
        isReject ? `Rejected — ${name} stays active.` : `Approved — ${name}`,
        { duration: 5000 },
      );
      router.refresh();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Decision failed';
      setError(msg);
      toast.error('Decision failed', { description: msg, duration: 8000 });
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent
        // The primitive caps at `sm:max-w-sm`; override the sm: variant (not a
        // base `max-w-md`, which loses to it) so the card is wide enough that
        // the full-bleed header/footer don't spill past its edges.
        className="sm:max-w-lg"
        // Direct initial focus to the natural first field instead of letting
        // Radix land it on the quiet Cancel button (whose brand focus-ring
        // reads like an error). Keeps focus inside the dialog for a11y.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (isReject ? reasonRef.current : confirmRef.current)?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isReject ? 'Reject' : 'Approve'} {typeLabel.toLowerCase()}
          </DialogTitle>
        </DialogHeader>

        {/* Compact change summary */}
        <div className="rounded-lg border border-gray-200 bg-gray-50/60 px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
            {item.account.customerCode && (
              <p className="font-mono text-xs text-brand-600">{item.account.customerCode}</p>
            )}
          </div>
          <div className="text-right shrink-0 tabular-nums text-sm">
            {item.changeType === 'DISCONNECTION' ? (
              <span className="font-semibold text-red-600">{formatRupees(item.oldArc)}</span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <span className="text-gray-500">{formatRupees(item.oldArc)}</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-semibold text-brand-600">{formatRupees(item.newArc)}</span>
              </span>
            )}
          </div>
        </div>

        {isReject ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reject-reason" className="text-sm font-medium text-gray-700">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              ref={reasonRef}
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Shown to the SAM who raised this. e.g. PO doesn't match the approved quote."
              disabled={busy}
            />
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 leading-relaxed">
              {!isTerminal
                ? 'Approving passes this to the next approver in the chain.'
                : isDisconnection
                  ? 'This is the final approval — it starts the disconnection timer.'
                  : 'Approving applies this change and makes it visible on the dashboard.'}
            </p>

            {showMaterial && (
              <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-sm font-medium text-gray-700">Material recovered</Label>
                  <div className="flex items-center gap-1.5">
                    {[
                      { v: true, label: 'Yes' },
                      { v: false, label: 'No' },
                    ].map(({ v, label }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setMaterialRecovered(v)}
                        disabled={busy}
                        aria-pressed={materialRecovered === v}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          materialRecovered === v
                            ? v
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea
                  value={materialNotes}
                  onChange={(e) => setMaterialNotes(e.target.value)}
                  rows={2}
                  placeholder="Notes (optional) — e.g. router + ONT collected, or what's still pending."
                  disabled={busy}
                />
                {!materialRecovered && (
                  <p className="text-xs text-amber-700">
                    Recorded as not recovered — the disconnection still goes ahead.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            ref={confirmRef}
            onClick={confirm}
            disabled={busy || reasonMissing}
            className={
              isReject
                ? 'bg-red-600 hover:bg-red-700 focus-visible:border-red-700 focus-visible:ring-red-600/40'
                : 'bg-emerald-600 hover:bg-emerald-700 focus-visible:border-emerald-700 focus-visible:ring-emerald-600/40'
            }
          >
            {busy ? 'Working…' : isReject ? 'Reject' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
