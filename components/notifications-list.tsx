'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  ClipboardList,
  UserPlus,
  UserMinus,
  Users as UsersIcon,
  Mail,
  CalendarPlus,
  CheckCircle2,
  ArrowRight,
  Inbox,
  Check,
  X,
  CheckCheck,
  Loader2,
} from 'lucide-react';
import {
  dismissNotification as dismissNotificationApi,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationFeed,
  type NotificationItem,
  type NotificationKind,
  type NotificationSeverity,
} from '../services/notifications';

const KIND_VISUAL: Record<
  NotificationKind,
  { icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  COMMERCIAL_CHANGE_COMMITTED: { icon: ClipboardList, label: 'Commercial change' },
  CUSTOMER_ASSIGNED: { icon: UserPlus, label: 'Assignment' },
  CUSTOMER_UNASSIGNED: { icon: UserMinus, label: 'Unassignment' },
  CUSTOMER_ACTIVATED: { icon: UsersIcon, label: 'New customer' },
  ACCOUNTS_TEAM_NOTIFIED: { icon: Mail, label: 'Notification' },
  CRM_ACTIVATION_PENDING: { icon: CalendarPlus, label: 'CRM action' },
  CRM_COMPLETED: { icon: CheckCircle2, label: 'CRM completed' },
  OTHER: { icon: Bell, label: 'Activity' },
};

const SEVERITY_TONE: Record<
  NotificationSeverity,
  { ring: string; iconBg: string; iconColor: string; pill: string }
> = {
  critical: {
    ring: 'ring-red-200',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    pill: 'bg-red-100 text-red-700',
  },
  warning: {
    ring: 'ring-amber-200',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    pill: 'bg-amber-100 text-amber-700',
  },
  info: {
    ring: 'ring-blue-200',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    pill: 'bg-blue-100 text-blue-700',
  },
  success: {
    ring: 'ring-emerald-200',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    pill: 'bg-emerald-100 text-emerald-700',
  },
};

export function NotificationsList({ initial }: { initial: NotificationFeed }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAll, setBusyAll] = useState(false);
  const [, startTransition] = useTransition();

  const groups = groupByDate(initial.notifications);

  const refresh = () => startTransition(() => router.refresh());

  async function onMarkRead(id: string) {
    setBusyId(id);
    try {
      await markNotificationRead(id);
      refresh();
    } finally {
      setBusyId(null);
    }
  }
  async function onDismiss(id: string) {
    setBusyId(id);
    try {
      await dismissNotificationApi(id);
      refresh();
    } finally {
      setBusyId(null);
    }
  }
  async function onMarkAll() {
    setBusyAll(true);
    try {
      await markAllNotificationsRead();
      refresh();
    } finally {
      setBusyAll(false);
    }
  }

  if (initial.notifications.length === 0) {
    return (
      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-12 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
          <Inbox className="w-7 h-7 text-gray-400" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">No notifications yet</h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          When customers are assigned, commercial changes are committed, or CRM orders advance,
          you'll see them here.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Bulk actions */}
      {initial.unread > 0 && (
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-xs text-gray-500">
            <span className="font-semibold text-brand-600">{initial.unread}</span> unread
          </span>
          <button
            type="button"
            onClick={onMarkAll}
            disabled={busyAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-600 bg-orange-50 hover:bg-orange-100 disabled:opacity-50 transition-colors"
          >
            {busyAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCheck className="w-3.5 h-3.5" />
            )}
            Mark all as read
          </button>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <section key={group.label} className="flex flex-col gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 px-1">
              {group.label}
            </h2>
            <div className="flex flex-col gap-2">
              {group.items.map((n) => (
                <NotificationCard
                  key={n.id}
                  n={n}
                  busy={busyId === n.id}
                  onMarkRead={() => onMarkRead(n.id)}
                  onDismiss={() => onDismiss(n.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function NotificationCard({
  n,
  busy,
  onMarkRead,
  onDismiss,
}: {
  n: NotificationItem;
  busy: boolean;
  onMarkRead: () => void;
  onDismiss: () => void;
}) {
  const visual = KIND_VISUAL[n.kind];
  const tone = SEVERITY_TONE[n.severity];
  const Icon = visual.icon;
  const isUnread = !n.readAt;

  return (
    <div
      className={`group relative bg-white rounded-xl ring-1 ${tone.ring} hover:shadow-md transition-shadow ${
        isUnread ? '' : 'opacity-80'
      }`}
    >
      {/* Unread dot */}
      {isUnread && (
        <span
          aria-hidden="true"
          className="absolute left-2 top-5 w-2 h-2 rounded-full bg-brand-600"
        />
      )}

      <Link
        href={n.href}
        onClick={() => {
          if (isUnread) {
            // Best-effort: mark read on navigate
            void markNotificationRead(n.id);
          }
        }}
        className="block p-4 pl-6 flex items-start gap-3"
      >
        <div
          className={`w-10 h-10 rounded-xl ${tone.iconBg} flex items-center justify-center flex-shrink-0`}
        >
          <Icon className={`w-5 h-5 ${tone.iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${tone.pill}`}
            >
              {visual.label}
            </span>
            {n.meta?.code && (
              <span className="font-mono text-[10px] text-brand-600 bg-orange-50 px-1.5 py-0.5 rounded">
                {n.meta.code}
              </span>
            )}
            {n.meta?.outcome && n.meta.outcome !== 'SENT' && (
              <span className="font-mono text-[9px] uppercase tracking-wider text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                {n.meta.outcome}
              </span>
            )}
            {!isUnread && (
              <span className="text-[10px] text-gray-400 inline-flex items-center gap-1">
                <Check className="w-3 h-3" />
                Read
              </span>
            )}
          </div>
          <h3
            className={`text-sm mt-1.5 ${
              isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'
            }`}
          >
            {n.title}
          </h3>
          <p className="text-sm text-gray-600 mt-0.5">{n.description}</p>
          <div className="text-[11px] text-gray-400 mt-2">
            {formatRelative(n.timestamp)}
            {n.actorName && <span> · by {n.actorName}</span>}
          </div>
        </div>
        <div className="flex items-center text-gray-300 group-hover:text-brand-600 transition-colors flex-shrink-0">
          <ArrowRight className="w-4 h-4" />
        </div>
      </Link>

      {/* Hover action bar */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
        ) : (
          <>
            {isUnread && (
              <button
                type="button"
                aria-label="Mark as read"
                title="Mark as read"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMarkRead();
                }}
                className="w-7 h-7 rounded-md bg-white text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 ring-1 ring-gray-200 flex items-center justify-center"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              aria-label="Delete"
              title="Delete"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDismiss();
              }}
              className="w-7 h-7 rounded-md bg-white text-gray-500 hover:text-red-600 hover:bg-red-50 ring-1 ring-gray-200 flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function groupByDate(items: NotificationItem[]): { label: string; items: NotificationItem[] }[] {
  const buckets = new Map<string, NotificationItem[]>();
  const order: string[] = [];

  for (const item of items) {
    const label = bucketLabel(new Date(item.timestamp));
    if (!buckets.has(label)) {
      buckets.set(label, []);
      order.push(label);
    }
    buckets.get(label)!.push(item);
  }
  return order.map((label) => ({ label, items: buckets.get(label)! }));
}

function bucketLabel(d: Date): string {
  const now = new Date();
  const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const today = startOfDay(now);
  const that = startOfDay(d);
  const diffDays = Math.floor((today - that) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'This week';
  if (diffDays < 30) return 'This month';
  return 'Older';
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatRelative(value: string): string {
  const d = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const min = Math.round(diffMs / (60 * 1000));
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(diffMs / (60 * 60 * 1000));
  if (hr < 24) return `${hr}h ago`;
  const day = d.getDate();
  const mo = MONTHS[d.getMonth()];
  const yr = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${mo} ${yr} · ${hh}:${mm}`;
}
