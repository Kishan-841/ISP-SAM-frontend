'use client';

import Link from 'next/link';
import { ArrowRight, Wifi, Zap } from 'lucide-react';
import { DataTable, type Column } from './data-table';
import { StatusPill, type PillTone } from './status-pill';
import type { ApprovalTab, ChangeType, PendingApproval } from '../services/commercial-changes';
import { formatRupees } from '../lib/format-rupees';

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : DATE_FMT.format(d).toLowerCase();
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

/** Read-only view of approved / rejected commercial changes. */
export function ApprovalsHistoryTable({
  items,
  tab,
}: {
  items: PendingApproval[];
  tab: Extract<ApprovalTab, 'approved' | 'rejected'>;
}) {
  const isRejected = tab === 'rejected';

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
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 ring-1 ring-amber-200">
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
          <span className="text-sm font-semibold text-red-600 tabular-nums">
            {formatRupees(c.oldArc)}
          </span>
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
      key: 'decidedBy',
      header: isRejected ? 'Rejected by' : 'Approved by',
      align: 'center',
      cell: (c) => <span className="text-sm text-gray-700">{c.decidedByName ?? '—'}</span>,
      className: 'px-5 py-4 text-center whitespace-nowrap',
    },
    {
      key: 'decidedAt',
      header: 'When',
      align: 'center',
      sortable: true,
      cell: (c) => (
        <span className="text-sm text-gray-500">
          {fmtDateTime(isRejected ? c.rejectedAt : c.approvedAt)}
        </span>
      ),
      className: 'px-5 py-4 text-center whitespace-nowrap',
    },
    ...(isRejected
      ? [
          {
            key: 'reason',
            header: 'Reason',
            cell: (c: PendingApproval) => (
              <span className="text-sm text-gray-700 line-clamp-2 max-w-xs" title={c.rejectionReason ?? undefined}>
                {c.rejectionReason ?? '—'}
              </span>
            ),
            className: 'px-5 py-4',
          } satisfies Column<PendingApproval>,
        ]
      : [
          {
            // Only disconnections carry a material-recovery outcome (recorded
            // by SUPER_ADMIN_2 on the final gate); everything else shows "—".
            key: 'material',
            header: 'Material',
            align: 'center',
            cell: (c: PendingApproval) =>
              c.materialRecovered == null ? (
                <span className="text-xs text-gray-400">—</span>
              ) : (
                <span title={c.materialRecoveryNotes ?? undefined}>
                  <StatusPill tone={c.materialRecovered ? 'emerald' : 'amber'}>
                    {c.materialRecovered ? 'Recovered' : 'Not recovered'}
                  </StatusPill>
                </span>
              ),
            className: 'px-5 py-4 text-center whitespace-nowrap',
          } satisfies Column<PendingApproval>,
        ]),
    {
      key: 'raisedBy',
      header: 'Raised by',
      align: 'center',
      cell: (c) => (
        <span className="text-sm text-gray-500">{c.account.samOwner?.name ?? 'Unassigned'}</span>
      ),
      className: 'px-5 py-4 text-center whitespace-nowrap',
    },
  ];

  return (
    <DataTable<PendingApproval>
      columns={columns}
      rows={items}
      rowKey={(c) => c.id}
      searchable
      searchPlaceholder="Search by customer, code, circuit"
      searchKeys={['account.clientName', 'account.companyName', 'account.customerCode', 'account.circuitId']}
      pagination
      emptyTitle={isRejected ? 'No rejected changes' : 'No approved changes yet'}
      emptySubtitle={
        isRejected
          ? 'Rejected commercial changes will appear here.'
          : 'Approved commercial changes will appear here.'
      }
      minWidth="min-w-[1000px]"
    />
  );
}
