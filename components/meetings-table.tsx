'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Mail,
  CheckCircle2,
  Clock,
  Eye,
  Trash2,
} from 'lucide-react';
import { DataTable, type Column } from './data-table';
import { StatusPill, type PillTone } from './status-pill';
import { AddMomDialog } from './add-mom-dialog';
import { ScheduleMeetingDialog } from './schedule-meeting-dialog';
import { ConfirmDeleteDialog } from './confirm-delete-dialog';
import { parseParticipants } from '../lib/participants';
import { formatDate, formatDateTime } from '../lib/format-date';
import { deleteMeeting, type ActionItem, type MeetingRow } from '../services/meetings';
import type { Account } from '../services/accounts';
import type { AuthUser } from '../services/auth';

type Status = 'PENDING' | 'COMPLETED';

const STATUS_ORDER: Status[] = ['PENDING', 'COMPLETED'];

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
  PENDING: {
    label: 'Pending',
    tone: 'orange',
    icon: Clock,
    activeBg: 'bg-brand-600',
    activeText: 'text-white',
    activeBadgeBg: 'bg-white/20',
    activeBadgeText: 'text-white',
    inactiveText: 'text-brand-700',
    inactiveBadgeBg: 'bg-orange-100',
    inactiveBadgeText: 'text-brand-700',
  },
  COMPLETED: {
    label: 'Completed',
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
  return m.momSentAt ? 'COMPLETED' : 'PENDING';
}

export function MeetingsTable({
  meetings,
  accounts,
  currentUser,
}: {
  meetings: MeetingRow[];
  accounts: Account[];
  currentUser?: AuthUser;
}) {
  const router = useRouter();
  const isAdmin = currentUser?.role === 'ADMIN';
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const editingMeeting =
    editingId !== null ? meetings.find((m) => m.id === editingId) ?? null : null;
  const deletingMeeting =
    confirmDeleteId !== null
      ? meetings.find((m) => m.id === confirmDeleteId) ?? null
      : null;

  async function onConfirmDelete() {
    if (!confirmDeleteId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteMeeting(confirmDeleteId);
      setConfirmDeleteId(null);
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete meeting');
    } finally {
      setDeleting(false);
    }
  }

  const counts = useMemo(() => {
    const c: Record<Status, number> = { PENDING: 0, COMPLETED: 0 };
    for (const m of meetings) c[statusOf(m)] += 1;
    return c;
  }, [meetings]);

  const [filter, setFilter] = useState<Status>(() =>
    meetings.some((m) => statusOf(m) === 'PENDING') ? 'PENDING' : 'COMPLETED',
  );

  const visible = useMemo(
    () => meetings.filter((m) => statusOf(m) === filter),
    [meetings, filter],
  );

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
        const meta = STATUS_META[statusOf(m)];
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
    ...(filter === 'COMPLETED'
      ? [
          {
            key: 'momSentAt',
            header: 'MOM Sent',
            sortable: true,
            cell: (m: MeetingRow) =>
              m.momSentAt ? (
                <span className="text-emerald-700 font-medium tabular-nums">
                  {formatDate(m.momSentAt)}
                </span>
              ) : (
                <span className="text-gray-300">—</span>
              ),
          } satisfies Column<MeetingRow>,
        ]
      : []),
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

      {/* Controlled instance for completing an existing MOM_PENDING meeting. */}
      {editingMeeting && (
        <AddMomDialog
          accounts={accounts}
          existingMeeting={editingMeeting}
          open
          onOpenChange={(o) => {
            if (!o) setEditingId(null);
          }}
        />
      )}

      {deletingMeeting && (
        <ConfirmDeleteDialog
          title="Delete meeting?"
          description={
            <>
              The meeting for{' '}
              <span className="font-semibold text-gray-900">
                {deletingMeeting.account.companyName || deletingMeeting.account.clientName}
              </span>{' '}
              on {formatDate(deletingMeeting.scheduledAt) ?? ''} will be permanently removed.
              Any MoM content is wiped. The deletion is recorded in the audit log.
            </>
          }
          confirmLabel="Delete meeting"
          busy={deleting}
          onCancel={() => {
            setConfirmDeleteId(null);
            setDeleteError(null);
          }}
          onConfirm={onConfirmDelete}
        />
      )}
      {deleteError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {deleteError}
        </div>
      )}

      {/* Status filter chips — just Pending + Completed. */}
      <div className="flex items-center gap-2 flex-wrap">
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
        onRowClick={(m) => setExpanded((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
        renderExpanded={(m) => <ExpandedMeetingRow meeting={m} />}
        isRowExpanded={(m) => !!expanded[m.id]}
        actions={(m) => (
          <div
            className="inline-flex items-center gap-1.5 justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            {statusOf(m) === 'PENDING' ? (
              <button
                type="button"
                onClick={() => setEditingId(m.id)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-sm ring-1 ring-brand-700/20 transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                Add MOM
              </button>
            ) : (
              <Link
                href={`/meetings/${m.id}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
              >
                <Eye className="w-3.5 h-3.5" />
                View MOM
              </Link>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setConfirmDeleteId(m.id)}
                title="Delete meeting (admin)"
                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-red-600 bg-white border border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
        emptyTitle={`No ${STATUS_META[filter].label.toLowerCase()} meetings`}
        emptySubtitle={
          filter === 'PENDING'
            ? "Use 'Schedule Meeting' or 'Add MOM' above to start one."
            : 'Completed meetings will appear here once a MoM is sent.'
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
  status,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  status: Status;
  label: string;
  count: number;
}) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;

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
    client.length === 0 &&
    gazon.length === 0 &&
    items.length === 0 &&
    !meeting.agenda &&
    !meeting.momContent;

  return (
    <div className="flex flex-col gap-4">
      {empty && (
        <p className="text-sm text-gray-500">
          No agenda, participants, action items, or MoM recorded for this meeting.
        </p>
      )}

      {meeting.momContent && (
        <div className="border border-amber-200 bg-amber-50 rounded-md p-3">
          <div className="text-xs uppercase tracking-wide text-brand-700 mb-1 font-semibold">
            Minutes of Meeting
          </div>
          <div className="text-sm text-gray-900 whitespace-pre-wrap">
            {meeting.momContent}
          </div>
        </div>
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

