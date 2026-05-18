'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ShieldCheck, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { DataTable, type Column } from './data-table';
import { StatusPill, type PillTone } from './status-pill';
import { CrmStatusPill } from './crm-status-pill';
import { decideRetention, type ProbableChurnRow } from '../services/probable-churn';
import { refreshCrmStatus } from '../services/commercial-changes';
import { formatRupeesCompact } from '../lib/format-rupees';

/*
 * Retain isn't just a status flip — it's a retention play. Clicking it
 * takes SAM to the commercial-change form pre-filled with the customer and
 * the rate-revision action type, so they can record the bandwidth uplift /
 * notes that actually convinced the customer to stay. When that form is
 * submitted the backend auto-resolves the pending disconnection as RETAIN.
 */
function retainHref(accountId: string): string {
  return `/commercial-change?type=RATE_REVISION&customerId=${encodeURIComponent(accountId)}`;
}

const STATUS_TONE: Record<ProbableChurnRow['account']['contractStatus'], PillTone> = {
  PROBABLE_CHURN: 'amber',
  DISCONNECTING: 'red',
};

const STATUS_LABEL: Record<ProbableChurnRow['account']['contractStatus'], string> = {
  PROBABLE_CHURN: 'Probable Churn',
  DISCONNECTING: 'Disconnecting',
};

export function ProbableChurnTable({
  rows,
  kittyFilter,
}: {
  rows: ProbableChurnRow[];
  /** When BASE, the CRM Hand-off column is hidden — Existing Base customers
   *  aren't CRM-synced so a CRM service order is never raised for them. */
  kittyFilter?: 'BASE' | 'NEW';
}) {
  const hideCrmColumn = kittyFilter === 'BASE';

  const allColumns: Array<Column<ProbableChurnRow> | null> = [
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      cell: (r) => {
        // Primary display = companyName when present (matches the rest of the
        // app). Show clientName as a secondary line so SAM can find a customer
        // they only know by client name (e.g. "rohit sharma" under "Google").
        const primary = r.customer.companyName || r.customer.clientName;
        const secondary =
          r.customer.companyName && r.customer.clientName !== r.customer.companyName
            ? r.customer.clientName
            : null;
        return (
          <Link
            href={`/customers/${r.customer.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col hover:text-brand-600 transition-colors"
          >
            <span className="text-sm font-medium text-gray-900 whitespace-nowrap">{primary}</span>
            {secondary && (
              <span className="text-xs text-gray-500 whitespace-nowrap">{secondary}</span>
            )}
            {r.customer.customerCode && (
              <span className="font-mono text-xs text-brand-600 whitespace-nowrap mt-0.5">
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
      key: 'kitty',
      header: 'Base',
      align: 'center',
      cell: (r) =>
        r.account.kittyType === 'NEW' ? (
          <StatusPill tone="emerald">New</StatusPill>
        ) : (
          <StatusPill tone="purple">Existing</StatusPill>
        ),
      className: 'px-5 py-4 text-center whitespace-nowrap',
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <StatusPill tone={STATUS_TONE[r.account.contractStatus]}>
          {STATUS_LABEL[r.account.contractStatus]}
        </StatusPill>
      ),
      align: 'center',
      className: 'px-5 py-4 text-center whitespace-nowrap',
    },
    {
      key: 'arcAtRisk',
      header: 'ARC at Risk',
      align: 'center',
      cell: (r) => (
        <span
          className="text-sm font-medium tabular-nums text-rose-700 whitespace-nowrap"
          title={`₹${r.account.currentArc.toLocaleString('en-IN')} per year`}
        >
          {formatRupeesCompact(r.account.currentArc)}
        </span>
      ),
      className: 'px-5 py-4 text-center',
    },
    {
      key: 'samOwner',
      header: 'SAM',
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
      key: 'effective',
      header: 'Raised On',
      cell: (r) => formatDate(r.effectiveDate),
      className: 'px-5 py-4 text-sm text-gray-700 whitespace-nowrap',
      align: 'left',
    },
    {
      key: 'countdown',
      header: 'Countdown',
      align: 'left',
      cell: (r) => <CountdownCell row={r} />,
      className: 'px-5 py-4 text-sm whitespace-nowrap',
    },
    hideCrmColumn
      ? null
      : {
          key: 'crm',
          header: 'CRM Hand-off',
          align: 'center',
          cell: (r) => <CrmHandoffCell row={r} />,
          className: 'px-5 py-4 text-center',
        },
    {
      key: 'actions',
      header: 'Decision',
      align: 'center',
      cell: (r) => <DecisionButtons row={r} />,
      className: 'px-5 py-4 text-center',
    },
  ];

  const columns = allColumns.filter((c): c is Column<ProbableChurnRow> => c !== null);

  return (
    <DataTable<ProbableChurnRow>
      columns={columns}
      rows={rows}
      rowKey={(r) => r.commercialChangeId}
      searchable
      searchPlaceholder="Search by customer, code"
      searchKeys={['customer.clientName', 'customer.companyName', 'customer.customerCode']}
      pagination
      emptyTitle="Nothing in the retention queue"
      minWidth={hideCrmColumn ? 'min-w-[1100px]' : 'min-w-[1300px]'}
    />
  );
}

function CrmHandoffCell({ row }: { row: ProbableChurnRow }) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [, startTransition] = useTransition();

  // Imported leads (no externalCrmId) never trigger a CRM hand-off — show
  // that up front instead of the misleading "sent to CRM on Proceed" hint.
  const isLocalOnly = !row.account.externalCrmId;

  if (isLocalOnly) {
    return (
      <span className="text-xs text-gray-500">Local-only — no CRM hand-off</span>
    );
  }

  // CRM-synced + still in the 21-day window: nothing in CRM yet, will be
  // raised on Proceed.
  if (row.account.contractStatus === 'PROBABLE_CHURN') {
    return (
      <span className="text-xs text-gray-400">Not yet — sent to CRM on Proceed</span>
    );
  }
  // CRM call attempted but rejected — surface the failure so SAM can act on
  // it. Audit log payload has the underlying error message.
  if (row.crmStatus === 'FAILED') {
    return (
      <div className="flex flex-col items-center gap-1">
        <CrmStatusPill status="FAILED" />
        <span className="text-[10px] text-rose-700 max-w-[200px] leading-tight">
          CRM rejected the service order — check audit log
        </span>
      </div>
    );
  }
  if (!row.crmServiceOrderId) {
    // DISCONNECTING but CRM order never landed (transport disabled etc).
    return (
      <span className="text-xs text-gray-500">No CRM order on file</span>
    );
  }

  const samRef = `SAM-${row.commercialChangeId.slice(0, 8).toUpperCase()}`;

  async function refresh() {
    setRefreshing(true);
    try {
      await refreshCrmStatus(row.commercialChangeId);
      startTransition(() => router.refresh());
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-2">
        <CrmStatusPill status={row.crmStatus} />
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          aria-label="Refresh CRM status"
          title="Pull the latest workflow status from CRM"
          className="w-6 h-6 grid place-items-center rounded-md border border-gray-200 bg-white text-gray-600 transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hoverable:hover:bg-gray-50 active:scale-[0.92] disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="font-mono text-[10px] text-gray-500" title={row.crmServiceOrderId ?? undefined}>
        {row.crmOrderNumber ?? samRef}
      </div>
    </div>
  );
}

function CountdownCell({ row }: { row: ProbableChurnRow }) {
  if (row.account.contractStatus === 'PROBABLE_CHURN') {
    const days = row.daysUntilPrompt ?? 0;
    if (days > 0) {
      return (
        <span className="text-gray-700">
          Prompt due in <span className="font-medium tabular-nums">{days}d</span>
        </span>
      );
    }
    return (
      <span className="text-amber-700 font-medium">
        Day-21 prompt due now ({Math.abs(days)}d overdue)
      </span>
    );
  }
  // DISCONNECTING
  const days = row.daysUntilTermination ?? 0;
  if (days > 0) {
    return (
      <span className="text-gray-700">
        Terminates in <span className="font-medium tabular-nums">{days}d</span>
      </span>
    );
  }
  return <span className="text-rose-700 font-medium">Termination pending sweep</span>;
}

function DecisionButtons({ row }: { row: ProbableChurnRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<'PROCEED' | null>(null);

  // PROCEED only allowed once day-21 prompt is due.
  const proceedReady =
    row.daysUntilPrompt !== null && row.daysUntilPrompt <= 0 && row.retentionDecision === null;
  const decided = row.retentionDecision !== null;

  async function proceed() {
    setSubmitting('PROCEED');
    setError(null);
    try {
      await decideRetention(row.commercialChangeId, 'PROCEED');
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to record decision');
    } finally {
      setSubmitting(null);
    }
  }

  if (decided) {
    return (
      <span className="text-xs text-gray-500">
        {row.retentionDecision === 'RETAIN' ? 'Retained' : 'Proceeding with disconnection'}
      </span>
    );
  }

  const baseBtn =
    'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md ' +
    'transition-[background-color,transform,box-shadow] duration-150 ease-[var(--ease-out)] ' +
    'active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed will-change-transform';

  return (
    <div className="flex items-center justify-center gap-2">
      <Link
        href={retainHref(row.customer.id)}
        className={`${baseBtn} bg-emerald-600 text-white hoverable:hover:bg-emerald-700 shadow-sm`}
        title="Open the rate-revision form pre-filled for this customer. Submitting it will retain them."
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        Retain
      </Link>
      <button
        type="button"
        onClick={proceed}
        disabled={!proceedReady || submitting !== null || isPending}
        className={`${baseBtn} bg-rose-600 text-white hoverable:hover:bg-rose-700 shadow-sm`}
        title={
          proceedReady
            ? 'Proceed with disconnection — schedules termination in 10 days'
            : 'Available once the 21-day retention window has elapsed'
        }
      >
        {submitting === 'PROCEED' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <XCircle className="w-3.5 h-3.5" />
        )}
        Proceed
      </button>
      {error && <span className="text-xs text-rose-700 ml-2">{error}</span>}
    </div>
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
