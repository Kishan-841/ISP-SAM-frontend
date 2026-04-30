'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { DataTable, type Column } from './data-table';
import { StatusPill } from './status-pill';
import { Within48hBadge } from './within-48h-badge';
import { LogMeetingDialog } from './log-meeting-dialog';
import type { MeetingRow } from '../services/meetings';
import type { Account } from '../services/accounts';

export function MeetingsTable({ meetings, accounts }: { meetings: MeetingRow[]; accounts: Account[] }) {
  const router = useRouter();

  const columns: Column<MeetingRow>[] = [
    {
      key: 'scheduledAt',
      header: 'Scheduled',
      sortable: true,
      cell: (m) => formatDateTime(m.scheduledAt),
    },
    { key: 'customer', header: 'Customer', sortable: true, cell: (m) => m.account.clientName },
    {
      key: 'kitty',
      header: 'Kitty',
      cell: (m) => (
        <StatusPill tone={m.account.kittyType === 'BASE' ? 'orange' : 'emerald'}>
          {m.account.kittyType === 'BASE' ? 'Base' : 'New'}
        </StatusPill>
      ),
    },
    { key: 'sam', header: 'SAM', cell: (m) => m.account.samOwner?.name ?? '—' },
    { key: 'heldAt', header: 'Held', cell: (m) => (m.heldAt ? m.heldAt.slice(0, 10) : '—') },
    { key: 'momSentAt', header: 'MOM Sent', cell: (m) => (m.momSentAt ? m.momSentAt.slice(0, 10) : '—') },
    {
      key: 'within48h',
      header: 'Within 48h',
      cell: (m) => <Within48hBadge heldAt={m.heldAt} momSentAt={m.momSentAt} />,
    },
  ];

  return (
    <DataTable<MeetingRow>
      title="Meetings"
      totalCount={meetings.length}
      searchable
      searchPlaceholder="Search by customer, SAM, date"
      searchKeys={['account.clientName', 'account.samOwner.name', 'scheduledAt']}
      pagination
      columns={columns}
      rows={meetings}
      rowKey={(m) => m.id}
      onRowClick={(m) => router.push(`/meetings/${m.id}`)}
      actions={(m) => (
        <Link
          href={`/meetings/${m.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm text-brand-600 font-medium hover:underline"
        >
          Open
        </Link>
      )}
      emptyTitle="No meetings yet"
      emptySubtitle="Click 'Log New Meeting' to schedule one."
      emptyIcon={Calendar}
      headerExtra={<LogMeetingDialog accounts={accounts} />}
      minWidth="min-w-[1000px]"
    />
  );
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toISOString().slice(0, 10);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${date} ${hh}:${mm}`;
}
