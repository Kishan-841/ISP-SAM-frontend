'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { MeetingRow } from '../services/meetings';
import type { Account } from '../services/accounts';
import { DataTable, dataTableClasses } from './data-table';
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
      <table className={`${dataTableClasses.table} min-w-[900px]`}>
        <thead className={dataTableClasses.thead}>
          <tr>
            <th className={dataTableClasses.th}>Scheduled</th>
            <th className={dataTableClasses.th}>Customer</th>
            <th className={dataTableClasses.th}>Kitty</th>
            <th className={dataTableClasses.th}>SAM</th>
            <th className={dataTableClasses.th}>Held</th>
            <th className={dataTableClasses.th}>MOM Sent</th>
            <th className={dataTableClasses.th}>Within 48h</th>
            <th className={dataTableClasses.th}></th>
          </tr>
        </thead>
        <tbody className={dataTableClasses.tbody}>
          {visible.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-5 py-10 text-center text-gray-500 italic">
                No meetings yet. Click &quot;Log New Meeting&quot; to schedule one.
              </td>
            </tr>
          ) : (
            visible.map((m) => (
              <tr key={m.id} className={dataTableClasses.tr}>
                <td className={dataTableClasses.tdPrimary}>{formatDateTime(m.scheduledAt)}</td>
                <td className={dataTableClasses.tdPrimary}>{m.account.clientName}</td>
                <td className="px-5 py-4">
                  <StatusPill tone={m.account.kittyType === 'BASE' ? 'orange' : 'emerald'}>
                    {m.account.kittyType === 'BASE' ? 'Base' : 'New'}
                  </StatusPill>
                </td>
                <td className={dataTableClasses.tdSecondary}>
                  {m.account.samOwner?.name ?? '—'}
                </td>
                <td className={dataTableClasses.tdSecondary}>{formatDateOrDash(m.heldAt)}</td>
                <td className={dataTableClasses.tdSecondary}>{formatDateOrDash(m.momSentAt)}</td>
                <td className="px-5 py-4">
                  <Within48hBadge heldAt={m.heldAt} momSentAt={m.momSentAt} />
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/meetings/${m.id}`}
                    className="text-brand-600 hover:underline font-medium text-sm"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
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
