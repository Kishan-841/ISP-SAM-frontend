import {
  ArrowRightLeft,
  Mail,
  Pencil,
  Plus,
  Send,
  ShieldAlert,
  UserMinus,
  UserPlus,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { AuditEntry } from '../services/audit';

const ACTION_META: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bg: string;
    color: string;
    describe?: (e: AuditEntry) => React.ReactNode;
  }
> = {
  COMMIT: {
    label: 'Commercial change committed',
    icon: Plus,
    bg: 'bg-emerald-50',
    color: 'text-emerald-600',
    describe: (e) => {
      const p = e.payload as { changeType?: string; oldArc?: number; newArc?: number };
      if (!p?.changeType) return null;
      const oldA = p.oldArc != null ? `₹${p.oldArc.toLocaleString('en-IN')}` : '?';
      const newA = p.newArc != null ? `₹${p.newArc.toLocaleString('en-IN')}` : '?';
      return (
        <span>
          <span className="font-medium">{labelType(p.changeType)}</span>
          <span className="text-gray-400"> · </span>
          {oldA}
          <span className="text-gray-400"> → </span>
          {newA}
        </span>
      );
    },
  },
  ASSIGN: {
    label: 'Customer assigned',
    icon: UserPlus,
    bg: 'bg-blue-50',
    color: 'text-blue-600',
  },
  UNASSIGN: {
    label: 'Customer unassigned',
    icon: UserMinus,
    bg: 'bg-amber-50',
    color: 'text-amber-600',
  },
  NOTIFY_ACCOUNTS_TEAM: {
    label: 'Accounts team notified',
    icon: Mail,
    bg: 'bg-violet-50',
    color: 'text-violet-600',
    describe: (e) => {
      const p = e.payload as { outcome?: string; detail?: string };
      const outcome = p?.outcome ?? 'UNKNOWN';
      const tone =
        outcome === 'SENT'
          ? 'bg-emerald-50 text-emerald-700'
          : outcome === 'SKIPPED'
            ? 'bg-gray-100 text-gray-600'
            : outcome === 'MISCONFIGURED'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-red-50 text-red-700';
      return (
        <span>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${tone}`}
          >
            {outcome}
          </span>
          {p?.detail && (
            <span className="text-gray-400 ml-2 text-xs">{p.detail}</span>
          )}
        </span>
      );
    },
  },
};

const FALLBACK = {
  label: '',
  icon: Pencil,
  bg: 'bg-gray-50',
  color: 'text-gray-500',
};

export function AuditTimeline({
  entries,
  emptyText = 'No activity recorded yet.',
  showEntity = true,
}: {
  entries: AuditEntry[];
  emptyText?: string;
  /** When false, the entity ref column is hidden (use this when the timeline
   *  is scoped to a single entity already). */
  showEntity?: boolean;
}) {
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-8 text-center">
        <ShieldAlert className="w-7 h-7 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <ol className="relative ml-3 border-l-2 border-gray-100">
      {entries.map((e) => {
        const meta = ACTION_META[e.action] ?? {
          ...FALLBACK,
          label: e.action.replace(/_/g, ' ').toLowerCase(),
        };
        const Icon = meta.icon;
        const description = meta.describe?.(e);
        return (
          <li key={e.id} className="ml-6 mb-4 last:mb-0">
            <span
              className={`absolute -left-[14px] mt-1 w-7 h-7 rounded-full ring-4 ring-white ${meta.bg} flex items-center justify-center`}
            >
              <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
            </span>
            <div className="bg-white ring-1 ring-gray-200 rounded-xl p-3.5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 capitalize">
                    {meta.label}
                  </div>
                  {description && (
                    <div className="text-sm text-gray-700 mt-0.5">{description}</div>
                  )}
                  {showEntity && (
                    <div className="text-[11px] text-gray-400 mt-1 font-mono">
                      {e.entityType} · {e.entityId.slice(0, 8)}
                    </div>
                  )}
                </div>
                <div className="text-right text-xs text-gray-500 flex-shrink-0">
                  <div>{formatTime(e.timestamp)}</div>
                  <div className="mt-0.5">
                    by{' '}
                    <span className="font-medium text-gray-700">
                      {e.performer?.name ?? 'Unknown user'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function labelType(t: string): string {
  switch (t) {
    case 'UPGRADE':
      return 'Upgrade';
    case 'DOWNGRADE':
      return 'Downgrade';
    case 'RATE_REVISION':
      return 'Rate Revision';
    case 'DISCONNECTION':
      return 'Disconnection';
    default:
      return t;
  }
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function formatTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const day = d.getDate();
  const mo = MONTHS[d.getMonth()];
  const yr = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${mo} ${yr} · ${hh}:${mm}`;
}

// Re-exported helper icons for the consumer.
export { Send, CheckCircle2, XCircle, ArrowRightLeft };
