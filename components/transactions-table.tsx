'use client';

import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { DataTable, type Column } from './data-table';
import { StatusPill, type PillTone } from './status-pill';
import type { CommercialChangeListItem } from '../services/commercial-changes';
import { formatRupeesCompact } from '../lib/format-rupees';

const TYPE_TONE: Record<CommercialChangeListItem['changeType'], PillTone> = {
  UPGRADE: 'emerald',
  DOWNGRADE: 'amber',
  RATE_REVISION: 'purple',
  TERMINATION: 'red',
};

const TYPE_LABEL: Record<CommercialChangeListItem['changeType'], string> = {
  UPGRADE: 'Upgrade',
  DOWNGRADE: 'Downgrade',
  RATE_REVISION: 'Rate Revision',
  TERMINATION: 'Termination',
};

export function TransactionsTable({ changes }: { changes: CommercialChangeListItem[] }) {
  const columns: Column<CommercialChangeListItem>[] = [
    {
      key: 'effectiveDate',
      header: 'Effective',
      sortable: true,
      cell: (c) => c.effectiveDate.slice(0, 10),
      className: 'px-5 py-4 text-sm text-gray-700 text-center',
      align: 'center',
    },
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      cell: (c) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{c.account.clientName}</span>
          {c.account.customerCode && (
            <span className="font-mono text-xs text-brand-600">{c.account.customerCode}</span>
          )}
        </div>
      ),
      className: 'px-5 py-4 text-center',
      align: 'center',
    },
    {
      key: 'type',
      header: 'Type',
      cell: (c) => <StatusPill tone={TYPE_TONE[c.changeType]}>{TYPE_LABEL[c.changeType]}</StatusPill>,
      align: 'center',
      className: 'px-5 py-4 text-center',
    },
    {
      key: 'oldNew',
      header: 'ARC Change',
      align: 'center',
      cell: (c) => (
        <div className="flex items-center justify-center gap-2 text-sm tabular-nums">
          <span className="text-gray-500" title={`₹${Number(c.oldMrr).toLocaleString('en-IN')}`}>
            {formatRupeesCompact(Number(c.oldMrr))}
          </span>
          <span className="text-gray-400">→</span>
          <span className="font-medium text-gray-900" title={`₹${Number(c.newMrr).toLocaleString('en-IN')}`}>
            {formatRupeesCompact(Number(c.newMrr))}
          </span>
        </div>
      ),
      className: 'px-5 py-4 text-center',
    },
    {
      key: 'delta',
      header: 'Δ',
      align: 'center',
      cell: (c) => {
        const delta = Number(c.newMrr) - Number(c.oldMrr);
        const cls = delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-gray-400';
        const sign = delta > 0 ? '+' : '';
        return (
          <span className={`text-sm font-medium ${cls}`}>
            {sign}₹{Math.round(delta).toLocaleString('en-IN')}
          </span>
        );
      },
      className: 'px-5 py-4 text-center',
    },
    {
      key: 'bandwidth',
      header: 'Bandwidth',
      align: 'center',
      cell: (c) =>
        c.oldBandwidthMbps !== null && c.newBandwidthMbps !== null ? (
          <div className="text-xs text-gray-500">
            {c.oldBandwidthMbps} →{' '}
            <span className="text-gray-900 font-medium">{c.newBandwidthMbps} Mbps</span>
          </div>
        ) : (
          '—'
        ),
      className: 'px-5 py-4 text-center text-sm text-gray-500',
    },
    {
      key: 'reason',
      header: 'Reason',
      cell: (c) => c.reason ?? '—',
      className: 'px-5 py-4 text-sm text-gray-500',
    },
    {
      key: 'approval',
      header: 'Approval',
      align: 'center',
      cell: (c) =>
        c.approvalFileUrl ? (
          <Link
            href={`/api/${c.approvalFileUrl}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-sm text-brand-600 hover:underline"
          >
            View
          </Link>
        ) : (
          '—'
        ),
      className: 'px-5 py-4 text-center',
    },
  ];

  return (
    <DataTable<CommercialChangeListItem>
      columns={columns}
      rows={changes}
      rowKey={(c) => c.id}
      searchable
      searchPlaceholder="Search by customer, code, reason"
      searchKeys={['account.clientName', 'account.customerCode', 'reason']}
      pagination
      emptyTitle="No commercial changes yet"
      emptySubtitle="Initiate one from Commercial Change."
      emptyIcon={ClipboardList}
      minWidth="min-w-[1100px]"
    />
  );
}
