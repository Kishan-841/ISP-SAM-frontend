'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  Check,
  Loader2,
  CalendarClock,
  ClipboardCheck,
  Mail,
  CheckCircle2,
  ListChecks,
} from 'lucide-react';
import { DataTable, type Column } from './data-table';
import { StatusPill, type PillTone } from './status-pill';
import { AddMomDialog } from './add-mom-dialog';
import { ScheduleMeetingDialog } from './schedule-meeting-dialog';
import { parseParticipants } from '../lib/participants';
import { formatDate, formatDateTime } from '../lib/format-date';
import {
  markHeld,
  type ActionItem,
  type MeetingRow,
} from '../services/meetings';
import type { Account } from '../services/accounts';

type Status = 'UPCOMING' | 'AWAITING_OUTCOME' | 'MOM_PENDING' | 'MOM_SENT';
type Filter = 'ALL' | Status;

const STATUS_ORDER: Status[] = [
  'UPCOMING',
  'AWAITING_OUTCOME',
  'MOM_PENDING',
  'MOM_SENT',
];

type StatusMeta = {
  label: string;
  tone: PillTone;
  icon: React.ComponentType<{ className?: string }>;
  activeBg: string;
  activeText: string;
  activeBadgeBg: string;
  activeBadgeText: string;
  inactiveText: string;
  inactiveBadgeBg: string;
  inactiveBadgeText: string;
};

const STATUS_META: Record<Status, StatusMeta> = {
  UPCOMING: {
    label: 'Upcoming',
    tone: 'blue',
    icon: CalendarClock,
    activeBg: 'bg-blue-600',
    activeText: 'text-white',
    activeBadgeBg: 'bg-white/20',
    activeBadgeText: 'text-white',
    inactiveText: 'text-blue-700',
    inactiveBadgeBg: 'bg-blue-100',
    inactiveBadgeText: 'text-blue-700',
  },
  AWAITING_OUTCOME: {
    label: 'Awaiting Outcome',
    tone: 'amber',
    icon: ClipboardCheck,
    activeBg: 'bg-amber-500',
    activeText: 'text-white',
    activeBadgeBg: 'bg-white/20',
    activeBadgeText: 'text-white',
    inactiveText: 'text-amber-700',
    inactiveBadgeBg: 'bg-amber-100',
    inactiveBadgeText: 'text-amber-700',
  },
  MOM_PENDING: {
    label: 'MOM Pending',
    tone: 'orange',
    icon: Mail,
    activeBg: 'bg-brand-600',
    activeText: 'text-white',
    activeBadgeBg: 'bg-white/20',
    activeBadgeText: 'text-white',
    inactiveText: 'text-brand-700',
    inactiveBadgeBg: 'bg-orange-100',
    inactiveBadgeText: 'text-brand-700',
  },
  MOM_SENT: {
    label: 'MOM Sent',
    tone: 'emerald',
    icon: CheckCircle2,
    activeBg: 'bg-emerald-600',
    activeText: 'text-white',
    activeBadgeBg: 'bg-white/20',
    activeBadgeText: 'text-white',
    inactiveText: 'text-emerald-700',
    inactiveBadgeBg: 'bg-emerald-100',
    inactiveBadgeText: 'text-emerald-700',
  },
};

const ACTION_ITEM_TONE: Record<ActionItem['currentStatus'], PillTone> = {
  Open: 'amber',
  'In Progress': 'blue',
  Closed: 'emerald',
};

function statusOf(m: MeetingRow): Status {
  if (m.heldAt && m.momSentAt) return 'MOM_SENT';
  if (m.heldAt) return 'MOM_PENDING';
  if (new Date(m.scheduledAt).getTime() <= Date.now()) return 'AWAITING_OUTCOME';
  return 'UPCOMING';
}

export function MeetingsTable({
  meetings,
  accounts,
}: {
  meetings: MeetingRow[];
  accounts: Account[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [localStatus, setLocalStatus] = useState<Record<string, Status>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const resolvedStatus = (m: MeetingRow): Status => localStatus[m.id] ?? statusOf(m);

  const counts = useMemo(() => {
    const c: Record<Status, number> = {
      UPCOMING: 0,
      AWAITING_OUTCOME: 0,
      MOM_PENDING: 0,
      MOM_SENT: 0,
    };
    for (const m of meetings) c[resolvedStatus(m)] += 1;
    return c;
  }, [meetings, localStatus]);

  const [filter, setFilter] = useState<Filter>(() => initialFilter(meetings));

  const visible = useMemo(() => {
    if (filter === 'ALL') return meetings;
    return meetings.filter((m) => resolvedStatus(m) === filter);
  }, [meetings, filter, localStatus]);

  async function onMarkHeld(id: string) {
    setBusyId(id);
    try {
      await markHeld(id);
      setLocalStatus((s) => ({ ...s, [id]: 'MOM_PENDING' }));
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

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
      cell: (m) => (
        <span className="font-medium text-gray-900">
          {m.account.companyName || m.account.clientName}
        </span>
      ),
      secondary: (m) =>
        [
          m.account.companyName ? m.account.clientName : null,
          m.account.customerCode,
          m.account.circuitId,
        ]
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
      key: 'status',
      header: 'Status',
      cell: (m) => {
        const meta = STATUS_META[resolvedStatus(m)];
        const Icon = meta.icon;
        return (
          <StatusPill tone={meta.tone}>
            <Icon className="w-3 h-3 mr-1" />
            {meta.label}
          </StatusPill>
        );
      },
    },
    {
      key: 'scheduledAt',
      header: 'Scheduled',
      sortable: true,
      cell: (m) => (
        <span className="text-gray-700 tabular-nums">
          {formatDateTime(m.scheduledAt) ?? '—'}
        </span>
      ),
    },
    {
      key: 'heldAt',
      header: 'Held',
      sortable: true,
      cell: (m) =>
        m.heldAt ? (
          <span className="text-gray-700 tabular-nums">{formatDate(m.heldAt)}</span>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
    {
      key: 'momSentAt',
      header: 'MOM Sent',
      sortable: true,
      cell: (m) =>
        m.momSentAt ? (
          <span className="text-emerald-700 font-medium tabular-nums">
            {formatDate(m.momSentAt)}
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
    {
      key: 'sam',
      header: 'SAM',
      cell: (m) => (
        <span className="text-gray-700">
          {m.account.samOwner?.name ?? m.createdByUser?.name ?? '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Top action row */}
      <div className="flex items-center justify-end gap-2 flex-wrap">
        <ScheduleMeetingDialog accounts={accounts} />
        <AddMomDialog accounts={accounts} />
      </div>

      {/* Status filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterChip
          active={filter === 'ALL'}
          onClick={() => setFilter('ALL')}
          icon={ListChecks}
          label="All"
          count={meetings.length}
        />
        {STATUS_ORDER.map((s) => (
          <FilterChip
            key={s}
            active={filter === s}
            onClick={() => setFilter(s)}
            status={s}
            label={STATUS_META[s].label}
            count={counts[s]}
          />
        ))}
      </div>

      <DataTable<MeetingRow>
        title="Meetings"
        totalCount={visible.length}
        searchable
        searchPlaceholder="Search by customer, code, circuit, SAM"
        searchKeys={[
          'account.companyName',
          'account.clientName',
          'account.customerCode',
          'account.circuitId',
          'account.samOwner.name',
        ]}
        pagination
        columns={columns}
        rows={visible}
        rowKey={(m) => m.id}
        onRowClick={(m) => router.push(`/meetings/${m.id}`)}
        renderExpanded={(m) => <ExpandedMeetingRow meeting={m} />}
        isRowExpanded={(m) => !!expanded[m.id]}
        actions={(m) => {
          const s = resolvedStatus(m);
          return (
            <div
              className="inline-flex items-center gap-1.5 justify-end"
              onClick={(e) => e.stopPropagation()}
            >
              {s === 'AWAITING_OUTCOME' && (
                <button
                  type="button"
                  onClick={() => onMarkHeld(m.id)}
                  disabled={busyId === m.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-sm ring-1 ring-brand-700/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[110px] justify-center"
                >
                  {busyId === m.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Marking…
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Mark Held
                    </>
                  )}
                </button>
              )}
              {s === 'MOM_PENDING' && (
                <Link
                  href={`/meetings/${m.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-sm ring-1 ring-brand-700/20 transition-all"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Add MOM
                </Link>
              )}
              {s === 'MOM_SENT' && (
                <Link
                  href={`/meetings/${m.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
                >
                  View MOM
                </Link>
              )}
              <Link
                href={`/meetings/${m.id}`}
                aria-label="Open meeting"
                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-brand-600 hover:bg-brand-50"
              >
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          );
        }}
        emptyTitle={
          filter === 'ALL'
            ? 'No meetings yet'
            : `No meetings in "${STATUS_META[filter].label}"`
        }
        emptySubtitle={
          filter === 'ALL'
            ? "Use 'Schedule Meeting' or 'Add MOM' above to record one."
            : 'Try clearing the filter or the search bar.'
        }
        emptyIcon={Calendar}
        minWidth="min-w-[1200px]"
      />
    </div>
  );
}

// ─── Filter chip ───────────────────────────────────────────────────

function FilterChip({
  active,
  onClick,
  icon: IconProp,
  status,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  status?: Status;
  label: string;
  count: number;
}) {
  const meta = status ? STATUS_META[status] : null;
  const Icon = IconProp ?? meta?.icon ?? ListChecks;

  if (active) {
    const activeBg = meta?.activeBg ?? 'bg-gray-900';
    const activeText = meta?.activeText ?? 'text-white';
    const badgeBg = meta?.activeBadgeBg ?? 'bg-white/20';
    const badgeText = meta?.activeBadgeText ?? 'text-white';
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${activeBg} ${activeText}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
        <span
          className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${badgeBg} ${badgeText}`}
        >
          {count}
        </span>
      </button>
    );
  }

  const inactiveText = meta?.inactiveText ?? 'text-gray-700';
  const inactiveBadgeBg = meta?.inactiveBadgeBg ?? 'bg-gray-100';
  const inactiveBadgeText = meta?.inactiveBadgeText ?? 'text-gray-600';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white border border-gray-200 ${inactiveText} hover:bg-gray-50 hover:border-gray-300 transition-all`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      <span
        className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${inactiveBadgeBg} ${inactiveBadgeText}`}
      >
        {count}
      </span>
    </button>
  );
}

// ─── Expanded row (participants + action items) ────────────────────

function ExpandedMeetingRow({ meeting }: { meeting: MeetingRow }) {
  const client = parseParticipants(meeting.clientParticipants);
  const gazon = parseParticipants(meeting.gazonParticipants);
  const items = meeting.actionItems ?? [];
  const empty =
    client.length === 0 && gazon.length === 0 && items.length === 0 && !meeting.agenda;

  return (
    <div className="flex flex-col gap-4">
      {empty && (
        <p className="text-sm text-gray-500">
          No agenda, participants, or action items recorded for this meeting.
        </p>
      )}

      {meeting.agenda && (
        <div className="border border-gray-200 rounded-md p-3 bg-white">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Agenda</div>
          <div className="text-sm text-gray-800 whitespace-pre-wrap">{meeting.agenda}</div>
        </div>
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
                <th className="px-3 py-2 text-left font-medium">Discussion</th>
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
                    <StatusPill tone={ACTION_ITEM_TONE[it.currentStatus] ?? 'gray'}>
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

// ─── Helpers ───────────────────────────────────────────────────────

function initialFilter(meetings: MeetingRow[]): Filter {
  let awaiting = 0;
  let pending = 0;
  for (const m of meetings) {
    const s = statusOf(m);
    if (s === 'AWAITING_OUTCOME') awaiting += 1;
    else if (s === 'MOM_PENDING') pending += 1;
  }
  // Land on the bucket with active work.
  if (awaiting > 0) return 'AWAITING_OUTCOME';
  if (pending > 0) return 'MOM_PENDING';
  return 'ALL';
}
