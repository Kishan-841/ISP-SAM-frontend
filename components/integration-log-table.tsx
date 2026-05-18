'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Plug } from 'lucide-react';
import { DataTable, type Column } from './data-table';
import { StatusPill, type PillTone } from './status-pill';
import { Button } from '@/components/ui/button';
import { IntegrationPayloadView } from './integration-payload-view';
import { formatDateTime } from '../lib/format-date';
import type { IntegrationEventRow, IntegrationStatus } from '../services/integrations';

const STATUS_TONE: Record<IntegrationStatus, PillTone> = {
  PROCESSED: 'emerald',
  DUPLICATE: 'blue',
  REJECTED: 'red',
  FAILED: 'amber',
};

const STATUS_FILTERS: Array<{ key: IntegrationStatus | 'ALL'; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'PROCESSED', label: 'Processed' },
  { key: 'DUPLICATE', label: 'Duplicate' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'FAILED', label: 'Failed' },
];

export function IntegrationLogTable({
  events,
  initialStatus,
}: {
  events: IntegrationEventRow[];
  initialStatus?: IntegrationStatus;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function setStatusFilter(status: IntegrationStatus | 'ALL') {
    const params = new URLSearchParams(searchParams.toString());
    if (status === 'ALL') params.delete('status');
    else params.set('status', status);
    const qs = params.toString();
    router.push(qs ? `/integrations?${qs}` : '/integrations');
  }

  const columns: Column<IntegrationEventRow>[] = [
    {
      key: 'expand',
      header: '',
      width: '2.5rem',
      cell: (e) => (
        <button
          type="button"
          aria-label={expanded[e.id] ? 'Collapse' : 'Expand'}
          onClick={(ev) => {
            ev.stopPropagation();
            setExpanded((prev) => ({ ...prev, [e.id]: !prev[e.id] }));
          }}
          className="text-gray-400 hover:text-gray-700 p-1 rounded"
        >
          {expanded[e.id] ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      ),
    },
    {
      key: 'receivedAt',
      header: 'Received',
      sortable: true,
      cell: (e) => formatDateTime(e.receivedAt),
    },
    {
      key: 'source',
      header: 'Source',
      cell: (e) => (
        <span className="font-mono text-xs text-gray-700">{e.source}</span>
      ),
    },
    {
      key: 'eventType',
      header: 'Event',
      cell: (e) => (
        <span className="font-mono text-xs text-gray-700">{e.eventType}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (e) => (
        <StatusPill tone={STATUS_TONE[e.status]}>{e.status}</StatusPill>
      ),
    },
    {
      key: 'account',
      header: 'Customer',
      cell: (e) =>
        e.account ? (
          <Link
            href={`/customers?kittyType=NEW`}
            className="text-sm text-gray-900 hover:text-brand-600"
          >
            {e.account.companyName || e.account.clientName}
          </Link>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'externalEventId',
      header: 'Event ID',
      cell: (e) => (
        <span className="font-mono text-xs text-gray-500" title={e.externalEventId}>
          {e.externalEventId.slice(0, 8)}…
        </span>
      ),
    },
    {
      key: 'remoteAddr',
      header: 'IP',
      cell: (e) => <span className="font-mono text-xs text-gray-500">{e.remoteAddr ?? '—'}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        {STATUS_FILTERS.map((f) => {
          const active =
            (f.key === 'ALL' && !initialStatus) ||
            (f.key !== 'ALL' && initialStatus === f.key);
          return (
            <Button
              key={f.key}
              type="button"
              size="sm"
              variant={active ? 'default' : 'outline'}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </Button>
          );
        })}
      </div>

      <DataTable<IntegrationEventRow>
        title="Webhook events"
        totalCount={events.length}
        searchable
        searchPlaceholder="Search by event id, status, IP"
        searchKeys={['externalEventId', 'status', 'eventType', 'remoteAddr']}
        pagination
        defaultPageSize={25}
        columns={columns}
        rows={events}
        rowKey={(e) => e.id}
        renderExpanded={(e) => <ExpandedEventRow event={e} />}
        isRowExpanded={(e) => !!expanded[e.id]}
        emptyTitle="No webhooks received yet"
        emptySubtitle="Run scripts/mock-crm.ts to send a test event."
        emptyIcon={Plug}
        minWidth="min-w-[1100px]"
      />
    </div>
  );
}

function ExpandedEventRow({ event }: { event: IntegrationEventRow }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <IntegrationPayloadView eventType={event.eventType} payload={event.payload} />
      </div>
      <div className="flex flex-col gap-3 text-sm">
        {event.statusReason && (
          <Field label="Reason">
            <span className="text-red-700">{event.statusReason}</span>
          </Field>
        )}
        {event.account && (
          <Field label="Account">
            <Link
              href={`/customers/${event.account.id}`}
              className="text-brand-600 hover:underline text-sm font-medium"
            >
              {event.account.companyName || event.account.clientName}
            </Link>
            {event.account.customerCode && (
              <span className="block font-mono text-[11px] text-gray-500 mt-0.5">
                {event.account.customerCode}
              </span>
            )}
          </Field>
        )}
        <Field label="Received at">{formatDateTime(event.receivedAt)}</Field>
        <Field label="Sent by CRM at">
          {event.occurredAt ? formatDateTime(event.occurredAt) : '—'}
        </Field>
        <ForensicsBlock event={event} />
      </div>
    </div>
  );
}

function ForensicsBlock({ event }: { event: IntegrationEventRow }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-gray-100 pt-3 mt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-700"
      >
        {open ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        {open ? 'Hide technical details' : 'Show technical details'}
      </button>
      {open && (
        <div className="flex flex-col gap-3 mt-2">
          <Field label="External Event ID">
            <span className="font-mono text-[11px] break-all text-gray-700">
              {event.externalEventId}
            </span>
          </Field>
          <Field label="Remote IP">
            <span className="font-mono text-xs">{event.remoteAddr ?? '—'}</span>
          </Field>
          <Field label="Timestamp header">
            <span className="font-mono text-xs">{event.timestampHeader ?? '—'}</span>
          </Field>
          <Field label="HMAC signature">
            <span className="font-mono text-[10px] break-all text-gray-500">
              {event.signatureHeader ?? '—'}
            </span>
          </Field>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-0.5">{label}</div>
      <div className="text-gray-900">{children}</div>
    </div>
  );
}
