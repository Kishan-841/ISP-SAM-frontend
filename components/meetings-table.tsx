'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MeetingRow } from '../services/meetings';
import type { Account } from '../services/accounts';
import { DataTable } from './data-table';
import { DataGrid, type Column } from './data-grid';
import { StatusPill } from './status-pill';
import { LogMeetingDialog } from './log-meeting-dialog';
import { Within48hBadge } from './within-48h-badge';

export function MeetingsTable({
  meetings,
  accounts,
}: {
  meetings: MeetingRow[];
  accounts: Account[];
}) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [pageSize, setPageSize] = useState(20);

  const filtered = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return meetings;
    return meetings.filter((m) => {
      const fields = [
        m.account.clientName,
        m.account.samOwner?.name,
        formatDateTime(m.scheduledAt),
      ];
      return fields.some((f) => (f ?? '').toString().toLowerCase().includes(q));
    });
  }, [meetings, searchValue]);

  const visible = useMemo(() => filtered.slice(0, pageSize), [filtered, pageSize]);

  const columns: Column<MeetingRow>[] = [
    {
      key: 'scheduled',
      header: 'Scheduled',
      cell: (m) => formatDateTime(m.scheduledAt),
      className: 'px-5 py-4 text-sm text-gray-900 font-medium border-r border-gray-100 last:border-r-0',
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (m) => m.account.clientName,
      className: 'px-5 py-4 text-sm text-gray-900 font-medium border-r border-gray-100 last:border-r-0',
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
      key: 'sam',
      header: 'SAM',
      cell: (m) => m.account.samOwner?.name ?? '—',
      className: 'px-5 py-4 text-sm text-gray-500 border-r border-gray-100 last:border-r-0',
    },
    {
      key: 'held',
      header: 'Held',
      cell: (m) => formatDateOrDash(m.heldAt),
      className: 'px-5 py-4 text-sm text-gray-500 border-r border-gray-100 last:border-r-0',
    },
    {
      key: 'momSent',
      header: 'MOM Sent',
      cell: (m) => formatDateOrDash(m.momSentAt),
      className: 'px-5 py-4 text-sm text-gray-500 border-r border-gray-100 last:border-r-0',
    },
    {
      key: 'within48h',
      header: 'Within 48h',
      cell: (m) => <Within48hBadge heldAt={m.heldAt} momSentAt={m.momSentAt} />,
    },
    {
      key: 'open',
      header: '',
      align: 'right',
      cell: (m) => (
        <Link
          href={`/meetings/${m.id}`}
          className="text-brand-600 hover:underline font-medium text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          Open
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      title="Meetings"
      count={meetings.length}
      searchPlaceholder="Search meetings…"
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
      right={<LogMeetingDialog accounts={accounts} />}
    >
      <DataGrid
        columns={columns}
        rows={visible}
        rowKey={(m) => m.id}
        emptyMessage={
          searchValue
            ? 'No meetings match your search.'
            : 'No meetings yet. Click "Log New Meeting" to schedule one.'
        }
        onRowClick={(m) => router.push(`/meetings/${m.id}`)}
        minWidth="min-w-[900px]"
      />
    </DataTable>
  );
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toISOString().slice(0, 10);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${date} ${hh}:${mm}`;
}

function formatDateOrDash(iso: string | null): string {
  if (!iso) return '—';
  return iso.slice(0, 10);
}
