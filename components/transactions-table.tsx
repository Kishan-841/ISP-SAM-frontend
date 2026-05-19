'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Zap } from 'lucide-react';
import { DataTable, type Column } from './data-table';
import { StatusPill, type PillTone } from './status-pill';
import { CrmStatusPill } from './crm-status-pill';
import { CrmRowActions } from './crm-row-actions';
import { TransactionDetailSheet } from './transaction-detail-sheet';
import type { CommercialChangeListItem } from '../services/commercial-changes';
import { formatRupeesCompact } from '../lib/format-rupees';

const TYPE_TONE: Record<CommercialChangeListItem['changeType'], PillTone> = {
  UPGRADE: 'emerald',
  DOWNGRADE: 'amber',
  RATE_REVISION: 'purple',
  DISCONNECTION: 'red',
};

const TYPE_LABEL: Record<CommercialChangeListItem['changeType'], string> = {
  UPGRADE: 'Upgrade',
  DOWNGRADE: 'Downgrade',
  RATE_REVISION: 'Rate Revision',
  DISCONNECTION: 'Disconnection',
};

export function TransactionsTable({ changes }: { changes: CommercialChangeListItem[] }) {
  const [selected, setSelected] = useState<CommercialChangeListItem | null>(null);

  const columns: Column<CommercialChangeListItem>[] = [
    {
      key: 'effectiveDate',
      header: 'Effective',
      sortable: true,
      cell: (c) => formatDate(c.effectiveDate),
      className: 'px-5 py-4 text-sm text-gray-700 text-center whitespace-nowrap',
      align: 'center',
    },
    {
      key: 'mailReceivedDate',
      header: 'Mail Received',
      sortable: true,
      cell: (c) =>
        c.mailReceivedDate ? (
          <span className="text-sm text-gray-700 whitespace-nowrap">
            {formatDate(c.mailReceivedDate)}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
      className: 'px-5 py-4 text-center whitespace-nowrap',
      align: 'center',
    },
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      cell: (c) => (
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-gray-900 whitespace-nowrap">{c.account.clientName}</span>
          {c.account.customerCode && (
            <span className="font-mono text-xs text-brand-600 whitespace-nowrap">{c.account.customerCode}</span>
          )}
        </div>
      ),
      className: 'px-5 py-4 text-center',
      align: 'center',
    },
    {
      key: 'kitty',
      header: 'Base',
      align: 'center',
      cell: (c) =>
        c.account.kittyType === 'NEW' ? (
          <StatusPill tone="emerald">New</StatusPill>
        ) : (
          <StatusPill tone="purple">Existing</StatusPill>
        ),
      className: 'px-5 py-4 text-center whitespace-nowrap',
    },
    {
      key: 'type',
      header: 'Type',
      cell: (c) => <StatusPill tone={TYPE_TONE[c.changeType]}>{TYPE_LABEL[c.changeType]}</StatusPill>,
      align: 'center',
      className: 'px-5 py-4 text-center whitespace-nowrap',
    },
    {
      key: 'oldNew',
      header: 'ARC Change',
      align: 'center',
      cell: (c) => {
        const oldArc = Number(c.oldArc);
        const newArc = Number(c.newArc);
        return (
          <div className="flex items-center justify-center gap-2 text-sm tabular-nums whitespace-nowrap">
            <span className="text-gray-500" title={`₹${oldArc.toLocaleString('en-IN')} per year`}>
              {formatRupeesCompact(oldArc)}
            </span>
            <span className="text-gray-400">→</span>
            <span className="font-medium text-gray-900" title={`₹${newArc.toLocaleString('en-IN')} per year`}>
              {formatRupeesCompact(newArc)}
            </span>
          </div>
        );
      },
      className: 'px-5 py-4 text-center',
    },
    {
      key: 'delta',
      header: 'Δ',
      align: 'center',
      cell: (c) => {
        const delta = Number(c.newArc) - Number(c.oldArc);
        const cls = delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-gray-400';
        const sign = delta > 0 ? '+' : '';
        return (
          <span
            className={`text-sm font-medium tabular-nums whitespace-nowrap ${cls}`}
            title={`${sign}₹${Math.round(delta).toLocaleString('en-IN')} per year`}
          >
            {sign}{formatRupeesCompact(delta)}
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
          <div className="text-xs text-gray-500 whitespace-nowrap">
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
      // Single-line preview only — the full text lives in the row-detail
      // sheet (click anywhere on the row to open). Avoids the previous
      // half-clamped two-line ellipsis that read as broken UI.
      cell: (c) =>
        c.reason ? (
          <span
            className="text-sm text-gray-500 truncate block max-w-[180px]"
            title="Click row to see the full reason"
          >
            {c.reason}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
      className: 'px-5 py-4',
    },
    {
      key: 'approval',
      header: 'Docs',
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
      className: 'px-5 py-4 text-center whitespace-nowrap',
    },
    {
      key: 'crmOrder',
      header: 'CRM Order',
      align: 'center',
      cell: (c) => {
        // Imported leads (no externalCrmId) never have a CRM service order;
        // showing the SAM ref under "CRM" would be misleading. Render a
        // muted "Local-only" pill instead.
        if (!c.account.externalCrmId) {
          return <span className="text-[10px] uppercase tracking-wider text-gray-400">Local-only</span>;
        }
        // Same SAM-XXXXXXXX reference we send to CRM as `notes` — handy for
        // cross-system support: ops can find this row in CRM by searching
        // their notes column for the SAM ref.
        const samRef = `SAM-${c.id.slice(0, 8).toUpperCase()}`;
        return (
          <div className="flex flex-col items-center gap-0.5">
            {c.crmOrderNumber ? (
              <span
                className="font-mono text-xs text-gray-700 whitespace-nowrap"
                title={c.crmServiceOrderId ?? undefined}
              >
                {c.crmOrderNumber}
              </span>
            ) : (
              <span className="text-xs text-gray-400">—</span>
            )}
            <span className="font-mono text-[10px] text-gray-400 whitespace-nowrap" title={c.id}>
              {samRef}
            </span>
          </div>
        );
      },
      className: 'px-5 py-4 text-center',
    },
    {
      key: 'crmStatus',
      header: 'CRM Status',
      align: 'center',
      cell: (c) => {
        // Quick-disconnect requests don't have a CRM order yet — they're
        // waiting on CRM Admin to approve. Show a distinct badge so users
        // can spot them at a glance instead of seeing a misleading "—".
        if (c.disconnectionMode === 'QUICK' && !c.quickApprovalDecision) {
          return (
            <StatusPill tone="amber">
              <Zap className="w-3 h-3 inline mr-1 -mt-0.5" />
              Quick · Awaiting CRM
            </StatusPill>
          );
        }
        if (c.disconnectionMode === 'QUICK' && c.quickApprovalDecision === 'REJECTED') {
          return <StatusPill tone="red">Quick · Rejected</StatusPill>;
        }
        return c.account.externalCrmId ? (
          <CrmStatusPill status={c.crmStatus} />
        ) : (
          <span className="text-xs text-gray-400">—</span>
        );
      },
      className: 'px-5 py-4 text-center whitespace-nowrap',
    },
    {
      key: 'actions',
      header: '',
      align: 'center',
      cell: (c) =>
        c.account.externalCrmId ? (
          // Stop click bubbling so the action buttons don't also open the
          // detail sheet under them.
          <div onClick={(e) => e.stopPropagation()}>
            <CrmRowActions
              changeId={c.id}
              crmStatus={c.crmStatus}
              hasCrmOrder={!!c.crmServiceOrderId}
            />
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
      className: 'px-5 py-4 text-center whitespace-nowrap',
    },
  ];

  return (
    <>
      <DataTable<CommercialChangeListItem>
        columns={columns}
        rows={changes}
        rowKey={(c) => c.id}
        searchable
        searchPlaceholder="Search by customer, code, reason"
        searchKeys={['account.clientName', 'account.customerCode', 'reason']}
        pagination
        onRowClick={(row) => setSelected(row)}
        emptyTitle="No commercial changes yet"
        emptySubtitle="Initiate one from Commercial Change."
        emptyIcon={ClipboardList}
        minWidth="min-w-[1400px]"
      />
      <TransactionDetailSheet
        change={selected}
        open={selected !== null}
        onOpenChange={(o) => {
          if (!o) setSelected(null);
        }}
      />
    </>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-05-08" → "8 May 2026". */
function formatDate(value: string): string {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return value;
  const [, y, mo, d] = m;
  const monthIdx = Number(mo) - 1;
  if (monthIdx < 0 || monthIdx > 11) return value;
  return `${Number(d)} ${MONTHS[monthIdx]} ${y}`;
}
