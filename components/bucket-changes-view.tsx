'use client';

import Link from 'next/link';
import { ClipboardList, ArrowLeft, FileText, Receipt } from 'lucide-react';
import { DataTable, type Column } from './data-table';
import { StatusPill, type PillTone } from './status-pill';
import type { BucketChangeRow } from '../services/dashboard';
import { formatRupeesCompact } from '../lib/format-rupees';

const TYPE_TONE: Record<BucketChangeRow['changeType'], PillTone> = {
  UPGRADE: 'emerald',
  DOWNGRADE: 'amber',
  RATE_REVISION: 'purple',
  DISCONNECTION: 'red',
};

export function BucketChangesView({
  rows,
  bucket,
  backHref,
  backLabel,
}: {
  rows: BucketChangeRow[];
  bucket: BucketChangeRow['changeType'];
  backHref: string;
  backLabel: string;
}) {
  const isDisconnection = bucket === 'DISCONNECTION';

  const columns: Column<BucketChangeRow>[] = [
    {
      key: 'effectiveDate',
      header: 'Effective',
      sortable: true,
      cell: (r) => formatDate(r.effectiveDate),
      className: 'px-5 py-4 text-sm text-gray-700 whitespace-nowrap',
      align: 'left',
    },
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      cell: (r) => {
        const name = r.customer.companyName || r.customer.clientName;
        return (
          <Link
            href={`/customers/${r.customer.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col hover:text-brand-600 transition-colors"
          >
            <span className="text-sm font-medium text-gray-900 whitespace-nowrap">{name}</span>
            {r.customer.customerCode && (
              <span className="font-mono text-xs text-brand-600 whitespace-nowrap">
                {r.customer.customerCode}
              </span>
            )}
          </Link>
        );
      },
      className: 'px-5 py-4',
      align: 'left',
    },
    {
      key: 'samOwner',
      header: 'SAM Owner',
      cell: (r) =>
        r.samOwner ? (
          <span className="text-sm text-gray-700 whitespace-nowrap">{r.samOwner.name}</span>
        ) : (
          <span className="text-sm text-gray-400">Unassigned</span>
        ),
      className: 'px-5 py-4',
      align: 'left',
    },
    {
      key: 'oldNew',
      header: 'ARC Change',
      align: 'center',
      cell: (r) => (
        <div className="flex items-center justify-center gap-2 text-sm tabular-nums whitespace-nowrap">
          <span className="text-gray-500" title={`₹${r.oldArc.toLocaleString('en-IN')} per year`}>
            {formatRupeesCompact(r.oldArc)}
          </span>
          <span className="text-gray-400">→</span>
          <span
            className="font-medium text-gray-900"
            title={`₹${r.newArc.toLocaleString('en-IN')} per year`}
          >
            {formatRupeesCompact(r.newArc)}
          </span>
        </div>
      ),
      className: 'px-5 py-4 text-center',
    },
    {
      key: 'delta',
      header: 'Δ ARC',
      align: 'center',
      cell: (r) => {
        const delta = r.deltaArc;
        const cls = delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-gray-400';
        const sign = delta > 0 ? '+' : '';
        return (
          <span
            className={`text-sm font-medium tabular-nums whitespace-nowrap ${cls}`}
            title={`${sign}₹${Math.round(delta).toLocaleString('en-IN')} per year`}
          >
            {sign}
            {formatRupeesCompact(delta)}
          </span>
        );
      },
      className: 'px-5 py-4 text-center',
    },
    // Disconnections show Reason instead of Bandwidth — bandwidth doesn't change
    // and the reason is the load-bearing detail for that bucket.
    isDisconnection
      ? {
          key: 'reason',
          header: 'Reason',
          cell: (r) =>
            r.disconnectionReason || r.reason ? (
              <span
                className="text-sm text-gray-600 line-clamp-2 max-w-[280px]"
                title={r.disconnectionReason ?? r.reason ?? undefined}
              >
                {r.disconnectionReason ?? r.reason}
              </span>
            ) : (
              <span className="text-gray-400">—</span>
            ),
          className: 'px-5 py-4',
          align: 'left',
        }
      : {
          key: 'bandwidth',
          header: 'Bandwidth',
          align: 'center',
          cell: (r) =>
            r.oldBandwidthMbps !== null && r.newBandwidthMbps !== null ? (
              <div className="text-xs text-gray-500 whitespace-nowrap">
                {r.oldBandwidthMbps} →{' '}
                <span className="text-gray-900 font-medium">{r.newBandwidthMbps} Mbps</span>
              </div>
            ) : (
              <span className="text-gray-400">—</span>
            ),
          className: 'px-5 py-4 text-center text-sm text-gray-500',
        },
    {
      key: 'docs',
      header: 'Docs',
      align: 'center',
      cell: (r) => {
        if (!r.approvalFileUrl && !r.poFileUrl) {
          return <span className="text-gray-400">—</span>;
        }
        return (
          <div className="flex items-center justify-center gap-3">
            {r.approvalFileUrl && (
              <a
                href={r.approvalFileUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                title="View customer approval"
              >
                <FileText className="w-3.5 h-3.5" />
                Approval
              </a>
            )}
            {r.poFileUrl && (
              <a
                href={r.poFileUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                title="View Purchase Order"
              >
                <Receipt className="w-3.5 h-3.5" />
                PO
              </a>
            )}
          </div>
        );
      },
      className: 'px-5 py-4 text-center whitespace-nowrap',
    },
    {
      key: 'crmStatus',
      header: 'CRM Status',
      align: 'center',
      cell: (r) =>
        r.crmStatus ? (
          <StatusPill tone={TYPE_TONE[r.changeType]}>{r.crmStatus.replace(/_/g, ' ')}</StatusPill>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
      className: 'px-5 py-4 text-center whitespace-nowrap',
    },
  ];

  return (
    <>
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-600 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {backLabel}
      </Link>
      <DataTable<BucketChangeRow>
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        searchable
        searchPlaceholder="Search by customer, code"
        searchKeys={['customer.clientName', 'customer.companyName', 'customer.customerCode']}
        pagination
        emptyTitle="No changes in this bucket"
        emptySubtitle="There are no commercial changes matching this view yet."
        emptyIcon={ClipboardList}
        minWidth="min-w-[1100px]"
      />
    </>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(value: string): string {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return value;
  const [, y, mo, d] = m;
  const monthIdx = Number(mo) - 1;
  if (monthIdx < 0 || monthIdx > 11) return value;
  return `${Number(d)} ${MONTHS[monthIdx]} ${y}`;
}
