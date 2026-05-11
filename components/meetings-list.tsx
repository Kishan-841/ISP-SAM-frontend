'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarClock,
  ClipboardCheck,
  Mail,
  CheckCircle2,
  ListChecks,
  Search,
  Loader2,
  Check,
  Send,
  ChevronDown,
  ChevronUp,
  Inbox,
  ChevronRight,
} from 'lucide-react';
import { ScheduleMeetingDialog } from './schedule-meeting-dialog';
import { AddMomDialog } from './add-mom-dialog';
import { StatusPill } from './status-pill';
import { formatDate, formatDateTime } from '../lib/format-date';
import { markHeld, submitMom, type MeetingRow } from '../services/meetings';
import type { Account } from '../services/accounts';

type Status = 'UPCOMING' | 'AWAITING_OUTCOME' | 'MOM_PENDING' | 'MOM_SENT';

const STATUS_ORDER: Status[] = ['MOM_PENDING', 'AWAITING_OUTCOME', 'UPCOMING', 'MOM_SENT'];

const STATUS_META: Record<
  Status,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    chipBg: string;
    chipRing: string;
    chipText: string;
    activeBg: string;
    activeText: string;
    badgeBg: string;
    badgeText: string;
    activeBadgeBg: string;
    activeBadgeText: string;
  }
> = {
  UPCOMING: {
    label: 'Upcoming',
    icon: CalendarClock,
    chipBg: 'bg-blue-50',
    chipRing: 'ring-blue-200',
    chipText: 'text-blue-700',
    activeBg: 'bg-blue-600',
    activeText: 'text-white',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    activeBadgeBg: 'bg-white/20',
    activeBadgeText: 'text-white',
  },
  AWAITING_OUTCOME: {
    label: 'Awaiting Outcome',
    icon: ClipboardCheck,
    chipBg: 'bg-amber-50',
    chipRing: 'ring-amber-200',
    chipText: 'text-amber-700',
    activeBg: 'bg-amber-500',
    activeText: 'text-white',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    activeBadgeBg: 'bg-white/20',
    activeBadgeText: 'text-white',
  },
  MOM_PENDING: {
    label: 'MOM Pending',
    icon: Mail,
    chipBg: 'bg-orange-50',
    chipRing: 'ring-orange-200',
    chipText: 'text-brand-700',
    activeBg: 'bg-brand-600',
    activeText: 'text-white',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-brand-700',
    activeBadgeBg: 'bg-white/20',
    activeBadgeText: 'text-white',
  },
  MOM_SENT: {
    label: 'MOM Sent',
    icon: CheckCircle2,
    chipBg: 'bg-emerald-50',
    chipRing: 'ring-emerald-200',
    chipText: 'text-emerald-700',
    activeBg: 'bg-emerald-600',
    activeText: 'text-white',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    activeBadgeBg: 'bg-white/20',
    activeBadgeText: 'text-white',
  },
};

function statusOf(m: MeetingRow): Status {
  if (m.heldAt && m.momSentAt) return 'MOM_SENT';
  if (m.heldAt) return 'MOM_PENDING';
  if (new Date(m.scheduledAt).getTime() <= Date.now()) return 'AWAITING_OUTCOME';
  return 'UPCOMING';
}

type Filter = 'ALL' | Status;

/**
 * Meetings & MOM — single flat list driven by status filter chips.
 *
 * Replaces the previous tab-and-sub-tab structure. Each row shows what
 * action is needed next; clicking the action (Mark Held / Compose MOM /
 * View MOM) expands inline so the SAM never leaves the page.
 */
export function MeetingsList({
  meetings,
  accounts,
}: {
  meetings: MeetingRow[];
  accounts: Account[];
}) {
  const counts = useMemo(() => countByStatus(meetings), [meetings]);
  const [filter, setFilter] = useState<Filter>(() => initialFilter(counts));
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const filtered =
      filter === 'ALL' ? meetings : meetings.filter((m) => statusOf(m) === filter);
    return filterByQuery(filtered, query);
  }, [meetings, filter, query]);

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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by customer, company, code, circuit ID, mobile, SAM…"
          className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 placeholder:text-gray-400"
        />
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <EmptyState filter={filter} hasAny={meetings.length > 0} />
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((m) => (
            <MeetingRow key={m.id} m={m} />
          ))}
        </ul>
      )}
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

  const inactiveText = meta?.chipText ?? 'text-gray-700';
  const inactiveBadgeBg = meta?.badgeBg ?? 'bg-gray-100';
  const inactiveBadgeText = meta?.badgeText ?? 'text-gray-600';
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

// ─── Row ───────────────────────────────────────────────────────────

function MeetingRow({ m }: { m: MeetingRow }) {
  const initial = statusOf(m);
  const router = useRouter();

  // Local optimistic state so Mark-as-Held flips the row's status without
  // waiting for a full router refresh round-trip.
  const [localStatus, setLocalStatus] = useState<Status>(initial);
  const [composing, setComposing] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState<'held' | 'mom' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = localStatus;
  const meta = STATUS_META[status];

  async function onMarkHeld() {
    setBusy('held');
    setError(null);
    try {
      await markHeld(m.id);
      setLocalStatus('MOM_PENDING');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mark held');
    } finally {
      setBusy(null);
    }
  }

  async function onSendMom() {
    if (content.trim().length === 0) {
      setError('MOM content cannot be empty.');
      return;
    }
    setBusy('mom');
    setError(null);
    try {
      await submitMom(m.id, content);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send MOM');
    } finally {
      setBusy(null);
    }
  }

  return (
    <li className="bg-white rounded-xl ring-1 ring-gray-200 hover:shadow-sm transition-shadow">
      <div className="p-4 flex items-start gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/customers/${m.account.id}`}
              className="text-sm font-semibold text-gray-900 hover:text-brand-600 truncate"
            >
              {m.account.companyName || m.account.clientName}
            </Link>
            <StatusPill tone={m.account.kittyType === 'BASE' ? 'orange' : 'emerald'}>
              {m.account.kittyType === 'BASE' ? 'Base' : 'New'}
            </StatusPill>
            <StatusPill tone={m.meetingType === 'PHYSICAL' ? 'purple' : 'blue'}>
              {m.meetingType === 'PHYSICAL' ? 'Physical' : 'Online'}
            </StatusPill>
            <StatusBadge status={status} meta={meta} />
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
            {m.account.customerCode && (
              <span className="font-mono text-brand-600">{m.account.customerCode}</span>
            )}
            {m.account.circuitId && (
              <>
                <span className="text-gray-300">·</span>
                <span className="font-mono">{m.account.circuitId}</span>
              </>
            )}
            {m.account.samOwner && (
              <>
                <span className="text-gray-300">·</span>
                <span>SAM: {m.account.samOwner.name}</span>
              </>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-2 flex items-center gap-3 flex-wrap">
            <span>
              <span className="text-gray-400">Scheduled:</span>{' '}
              <span className="font-medium text-gray-700">
                {formatDateTime(m.scheduledAt) ?? '—'}
              </span>
            </span>
            {m.heldAt && (
              <span>
                <span className="text-gray-400">Held:</span>{' '}
                <span className="font-medium text-gray-700">{formatDate(m.heldAt) ?? '—'}</span>
              </span>
            )}
            {m.momSentAt && (
              <span>
                <span className="text-gray-400">MOM sent:</span>{' '}
                <span className="font-medium text-emerald-700">
                  {formatDate(m.momSentAt) ?? '—'}
                </span>
              </span>
            )}
          </div>
          {m.agenda && (
            <p className="text-xs text-gray-600 mt-2 line-clamp-2">{m.agenda}</p>
          )}
        </div>

        {/* Action area — varies by status */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {status === 'UPCOMING' && (
            <Link
              href={`/meetings/${m.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
            >
              Open
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
          {status === 'AWAITING_OUTCOME' && (
            <button
              type="button"
              onClick={onMarkHeld}
              disabled={busy === 'held'}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-sm ring-1 ring-brand-700/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy === 'held' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Marking…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Mark as Held
                </>
              )}
            </button>
          )}
          {status === 'MOM_PENDING' && !composing && (
            <button
              type="button"
              onClick={() => setComposing(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-sm ring-1 ring-brand-700/20 transition-all"
            >
              <Mail className="w-4 h-4" />
              Compose MOM
            </button>
          )}
          {status === 'MOM_PENDING' && composing && (
            <button
              type="button"
              onClick={() => setComposing(false)}
              disabled={busy === 'mom'}
              className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          {status === 'MOM_SENT' && m.momContent && (
            <button
              type="button"
              onClick={() => setViewing((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
            >
              {viewing ? (
                <>
                  Hide MOM
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  View MOM
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
          {status !== 'UPCOMING' && (
            <Link
              href={`/meetings/${m.id}`}
              className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-brand-600"
              aria-label="Open meeting detail"
            >
              Open
            </Link>
          )}
        </div>
      </div>

      {/* Inline MOM composer */}
      {status === 'MOM_PENDING' && composing && (
        <div className="border-t border-gray-100 bg-gray-50/60 p-4 flex flex-col gap-3">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            MOM content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Discussion summary, decisions, next steps…"
            className="w-full p-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 resize-y"
          />
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onSendMom}
              disabled={busy === 'mom' || content.trim().length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-sm ring-1 ring-brand-700/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] justify-center"
            >
              {busy === 'mom' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send MOM
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Inline MOM viewer (sent) */}
      {status === 'MOM_SENT' && viewing && m.momContent && (
        <div className="border-t border-gray-100 bg-emerald-50/40 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-2">
            MOM content
          </div>
          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
            {m.momContent}
          </pre>
        </div>
      )}

      {/* "Just held" hint */}
      {initial === 'AWAITING_OUTCOME' && status === 'MOM_PENDING' && !composing && (
        <div className="border-t border-gray-100 bg-emerald-50/40 px-4 py-2.5 flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Marked as held. Compose the MOM now or come back to it later — it's filed under
          <span className="font-semibold ml-1">MOM Pending</span>.
        </div>
      )}

      {error && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}
    </li>
  );
}

function StatusBadge({ status, meta }: { status: Status; meta: typeof STATUS_META[Status] }) {
  const Icon = meta.icon;
  void status;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${meta.chipBg} ${meta.chipText} ring-1 ${meta.chipRing}`}
    >
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

// ─── Empty state ───────────────────────────────────────────────────

function EmptyState({ filter, hasAny }: { filter: Filter; hasAny: boolean }) {
  if (!hasAny) {
    return (
      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-10 text-center">
        <Inbox className="w-7 h-7 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-700">No meetings yet</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Use Schedule Meeting or Add MOM above to record one.
        </p>
      </div>
    );
  }
  const label =
    filter === 'ALL' ? 'No matches' : `No meetings in "${STATUS_META[filter].label}"`;
  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-200 p-10 text-center">
      <Inbox className="w-7 h-7 text-gray-300 mx-auto mb-3" />
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">
        Try clearing the filter or the search bar.
      </p>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────

function countByStatus(meetings: MeetingRow[]): Record<Status, number> {
  const counts: Record<Status, number> = {
    UPCOMING: 0,
    AWAITING_OUTCOME: 0,
    MOM_PENDING: 0,
    MOM_SENT: 0,
  };
  for (const m of meetings) counts[statusOf(m)] += 1;
  return counts;
}

function initialFilter(counts: Record<Status, number>): Filter {
  // Land on the most-actionable bucket the user has work in.
  if (counts.AWAITING_OUTCOME > 0) return 'AWAITING_OUTCOME';
  if (counts.MOM_PENDING > 0) return 'MOM_PENDING';
  return 'ALL';
}

function filterByQuery(meetings: MeetingRow[], query: string): MeetingRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return meetings;
  return meetings.filter((m) => {
    const haystack = [
      m.account.companyName,
      m.account.clientName,
      m.account.customerCode,
      m.account.circuitId,
      m.account.samOwner?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
