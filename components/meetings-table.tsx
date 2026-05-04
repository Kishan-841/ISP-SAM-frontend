'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ChevronDown, ChevronRight, ArrowUpRight } from 'lucide-react';
import { DataTable, type Column } from './data-table';
import { StatusPill, type PillTone } from './status-pill';
import { AddMomDialog } from './add-mom-dialog';
import { parseParticipants } from '../lib/participants';
import { formatDate, formatDateTime } from '../lib/format-date';
import type { ActionItem, MeetingRow } from '../services/meetings';
import type { Account } from '../services/accounts';

const STATUS_TONE: Record<ActionItem['currentStatus'], PillTone> = {
  Open: 'amber',
  'In Progress': 'blue',
  Closed: 'emerald',
};

export function MeetingsTable({ meetings, accounts }: { meetings: MeetingRow[]; accounts: Account[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const columns: Column<MeetingRow>[] = [
    {
      key: 'expand',
      header: '',
      width: '2.5rem',
      cell: (m) => (
        <button
          type="button"
          aria-label={expanded[m.id] ? 'Collapse' : 'Expand'}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((prev) => ({ ...prev, [m.id]: !prev[m.id] }));
          }}
          className="text-gray-400 hover:text-gray-700 p-1 rounded"
        >
          {expanded[m.id] ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      cell: (m) => m.account.companyName || m.account.clientName,
      secondary: (m) =>
        [m.account.companyName ? m.account.clientName : null, m.account.customerCode, m.account.circuitId]
          .filter(Boolean)
          .join(' · ') || null,
    },
    {
      key: 'kitty',
      header: 'Kitty',
      cell: (m) => (
        <StatusPill tone={m.account.kittyType === 'BASE' ? 'orange' : 'emerald'}>
          {m.account.kittyType === 'BASE' ? 'Base' : 'New'}
        </StatusPill>
      ),
    },
    {
      key: 'meetingType',
      header: 'Type',
      cell: (m) => (
        <StatusPill tone={m.meetingType === 'PHYSICAL' ? 'purple' : 'blue'}>
          {m.meetingType === 'PHYSICAL' ? 'Physical' : 'Online'}
        </StatusPill>
      ),
    },
    {
      key: 'participants',
      header: 'Participants',
      cell: (m) => {
        const client = parseParticipants(m.clientParticipants).length;
        const gazon = parseParticipants(m.gazonParticipants).length;
        return (
          <span className="text-sm text-gray-700 tabular-nums">
            {client} <span className="text-gray-400">/</span> {gazon}
          </span>
        );
      },
    },
    {
      key: 'actionItems',
      header: 'Action Items',
      cell: (m) => <StatusPill tone="amber">{m.actionItems?.length ?? 0}</StatusPill>,
    },
    {
      key: 'sam',
      header: 'SAM',
      cell: (m) => m.account.samOwner?.name ?? m.createdByUser?.name ?? '—',
    },
    {
      key: 'heldAt',
      header: 'Held',
      sortable: true,
      cell: (m) => formatDateTime(m.heldAt),
    },
    { key: 'momSentAt', header: 'MOM Sent', cell: (m) => formatDate(m.momSentAt) },
  ];

  return (
    <DataTable<MeetingRow>
      title="Meetings"
      totalCount={meetings.length}
      searchable
      searchPlaceholder="Search by customer, SAM, date"
      searchKeys={['account.companyName', 'account.clientName', 'account.samOwner.name', 'heldAt']}
      pagination
      columns={columns}
      rows={meetings}
      rowKey={(m) => m.id}
      onRowClick={(m) => router.push(`/meetings/${m.id}`)}
      renderExpanded={(m) => <ExpandedMeetingRow meeting={m} />}
      isRowExpanded={(m) => !!expanded[m.id]}
      actions={(m) => (
        <Link
          href={`/meetings/${m.id}`}
          onClick={(e) => e.stopPropagation()}
          aria-label="Open meeting"
          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-brand-600 hover:bg-brand-50"
        >
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      )}
      emptyTitle="No meetings yet"
      emptySubtitle="Click 'Add MOM' to record one."
      emptyIcon={Calendar}
      headerExtra={<AddMomDialog accounts={accounts} />}
      minWidth="min-w-[1100px]"
    />
  );
}

function ExpandedMeetingRow({ meeting }: { meeting: MeetingRow }) {
  const client = parseParticipants(meeting.clientParticipants);
  const gazon = parseParticipants(meeting.gazonParticipants);
  const items = meeting.actionItems ?? [];
  const empty = client.length === 0 && gazon.length === 0 && items.length === 0;

  return (
    <div className="flex flex-col gap-4">
      {empty && (
        <p className="text-sm text-gray-500">
          No participants or action items recorded for this meeting.
        </p>
      )}

      {(client.length > 0 || gazon.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParticipantsBlock title="Client Participants" rows={client} />
          <ParticipantsBlock title="Gazon Participants" rows={gazon} />
        </div>
      )}

      {items.length > 0 && (
        <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-orange-50 text-gray-700">
              <tr>
                <th className="px-3 py-2 text-left font-medium w-10">SR</th>
                <th className="px-3 py-2 text-left font-medium">Discussion Description</th>
                <th className="px-3 py-2 text-left font-medium">Action Owner</th>
                <th className="px-3 py-2 text-left font-medium">Plan of Action</th>
                <th className="px-3 py-2 text-left font-medium w-32">Closure Date</th>
                <th className="px-3 py-2 text-left font-medium w-32">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-gray-600">{it.srNo || idx + 1}</td>
                  <td className="px-3 py-2 text-gray-900">{it.discussionDescription}</td>
                  <td className="px-3 py-2 text-gray-700">{it.actionOwner || '—'}</td>
                  <td className="px-3 py-2 text-gray-700">{it.planOfAction || '—'}</td>
                  <td className="px-3 py-2 text-gray-700">{it.closureDate || '—'}</td>
                  <td className="px-3 py-2">
                    <StatusPill tone={STATUS_TONE[it.currentStatus] ?? 'gray'}>
                      {it.currentStatus}
                    </StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ParticipantsBlock({
  title,
  rows,
}: {
  title: string;
  rows: { name: string; position: string }[];
}) {
  return (
    <div className="border border-gray-200 rounded-md p-3 bg-white">
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">{title}</div>
      {rows.length === 0 ? (
        <div className="text-sm text-gray-400">—</div>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {rows.map((p, idx) => (
            <li key={idx} className="text-gray-900">
              {p.name}
              {p.position && <span className="text-gray-500"> · {p.position}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

