'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  ExternalLink,
  Fingerprint,
  Globe,
  Monitor,
  User as UserIcon,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { StatusPill, type PillTone } from './status-pill';
import type { AuditEntry } from '../services/audit';

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

const ACTION_LABEL: Record<string, { label: string; tone: PillTone }> = {
  COMMIT: { label: 'Commercial change', tone: 'emerald' },
  ASSIGN: { label: 'Assigned', tone: 'blue' },
  UNASSIGN: { label: 'Unassigned', tone: 'amber' },
  UPDATE_FIELD: { label: 'Field edit', tone: 'orange' },
  LOGIN: { label: 'Login', tone: 'emerald' },
  LOGOUT: { label: 'Logout', tone: 'gray' },
  LOGIN_FAILED: { label: 'Failed login', tone: 'red' },
  NOTIFY_ACCOUNTS_TEAM: { label: 'Notify accounts', tone: 'purple' },
};

/**
 * Slide-out panel showing the full forensic detail of a single audit
 * entry. Opened by clicking a row in the audit log table.
 */
export function AuditDetailSheet({
  entry,
  open,
  onOpenChange,
}: {
  entry: AuditEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl w-full p-0 flex flex-col gap-0">
        {entry ? <SheetBody entry={entry} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function SheetBody({ entry }: { entry: AuditEntry }) {
  const meta = ACTION_LABEL[entry.action] ?? {
    label: entry.action.replace(/_/g, ' ').toLowerCase(),
    tone: 'gray' as PillTone,
  };
  const entityHref = entityLink(entry);

  return (
    <>
      <SheetHeader className="px-6 py-5 border-b border-gray-100 bg-gradient-to-b from-orange-50/70 to-white flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
          <span className="text-xs text-gray-400 font-mono">{entry.id.slice(0, 8)}</span>
        </div>
        <SheetTitle className="text-base font-semibold text-gray-900 mt-2">
          {humanTitle(entry)}
        </SheetTitle>
        <SheetDescription className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
          <Calendar className="w-3 h-3" />
          {DATE_FMT.format(new Date(entry.timestamp))}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
        {/* Who */}
        <DetailBlock title="Who" icon={UserIcon}>
          {entry.performer ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-gray-900">
                {entry.performer.name}
              </span>
              <a
                href={`mailto:${entry.performer.email}`}
                className="text-xs text-gray-600 hover:text-brand-600"
              >
                {entry.performer.email}
              </a>
              <span className="mt-1 inline-block text-[10px] uppercase tracking-wider font-semibold text-gray-500 bg-gray-100 rounded px-1.5 py-0.5 self-start">
                {entry.performer.role}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-500 italic">
              {entry.performedBy ? 'Unknown user' : 'System / anonymous (pre-auth event)'}
            </span>
          )}
        </DetailBlock>

        {/* Where (IP + UA) */}
        <DetailBlock title="Where" icon={Globe}>
          {entry.ipAddress ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-sm text-gray-900">{entry.ipAddress}</span>
              </div>
              {entry.userAgent && (
                <div className="flex items-start gap-1.5 text-[11px] text-gray-500">
                  <Monitor className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400" />
                  <span className="break-all">{entry.userAgent}</span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
        </DetailBlock>

        {/* Entity */}
        <DetailBlock title="Entity" icon={Fingerprint}>
          <div className="flex flex-col gap-1">
            <div className="text-xs text-gray-500">
              {entry.entityType}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-gray-700">{entry.entityId}</span>
              {entityHref && (
                <Link
                  href={entityHref}
                  className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open
                </Link>
              )}
            </div>
          </div>
        </DetailBlock>

        {/* Friendly summary */}
        <DetailBlock title="What changed" icon={ArrowRight}>
          <PayloadSummary entry={entry} />
        </DetailBlock>

        {/* Raw payload */}
        {entry.payload != null && (
          <DetailBlock title="Raw payload" icon={Fingerprint}>
            <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-[11px] font-mono text-gray-700 whitespace-pre-wrap break-all max-h-80 overflow-auto">
              {JSON.stringify(entry.payload, null, 2)}
            </pre>
          </DetailBlock>
        )}
      </div>
    </>
  );
}

function DetailBlock({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
        <h3 className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
          {title}
        </h3>
      </header>
      <div className="pl-5">{children}</div>
    </section>
  );
}

function PayloadSummary({ entry }: { entry: AuditEntry }) {
  const p = entry.payload as Record<string, unknown> | null;

  if (entry.action === 'UPDATE_FIELD' && p && typeof p.field === 'string') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-2">
          {p.field}
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 w-12 mt-0.5">
              from
            </span>
            <code className="bg-white border border-gray-200 rounded px-2 py-1 text-xs flex-1 line-through text-gray-500 break-all">
              {fmtValue(p.from)}
            </code>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 w-12 mt-0.5">
              to
            </span>
            <code className="bg-emerald-50 border border-emerald-200 rounded px-2 py-1 text-xs flex-1 text-emerald-900 break-all">
              {fmtValue(p.to)}
            </code>
          </div>
        </div>
      </div>
    );
  }

  if (entry.action === 'COMMIT' && p) {
    return (
      <div className="text-sm text-gray-700">
        <span className="font-medium">{String(p.changeType ?? '')}</span>
        {p.oldArc != null && p.newArc != null && (
          <>
            <span className="text-gray-400"> · </span>
            ₹{Number(p.oldArc).toLocaleString('en-IN')}
            <span className="text-gray-400 mx-1">→</span>
            ₹{Number(p.newArc).toLocaleString('en-IN')}
          </>
        )}
      </div>
    );
  }

  if ((entry.action === 'LOGIN' || entry.action === 'LOGIN_FAILED') && p) {
    const email = p.email ?? p.emailAttempted;
    const role = typeof p.role === 'string' ? p.role : null;
    const reason = typeof p.reason === 'string' ? p.reason : null;
    return (
      <div className="text-sm">
        <div className="font-mono text-xs text-gray-700">{String(email ?? '—')}</div>
        {role && (
          <div className="mt-1 text-[10px] uppercase tracking-wider font-semibold text-gray-500">
            {role}
          </div>
        )}
        {reason && <div className="mt-1 text-xs text-red-600">{reason}</div>}
      </div>
    );
  }

  if (entry.action === 'NOTIFY_ACCOUNTS_TEAM' && p) {
    const outcome = String(p.outcome ?? 'UNKNOWN');
    const detail = typeof p.detail === 'string' ? p.detail : null;
    return (
      <div className="flex flex-col gap-2 text-sm">
        <div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700">
            {outcome}
          </span>
        </div>
        {detail && <div className="text-xs text-gray-600 break-words">{detail}</div>}
      </div>
    );
  }

  if (!p) return <span className="text-sm text-gray-400">No additional detail.</span>;
  return <span className="text-sm text-gray-500">See raw payload below.</span>;
}

function fmtValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v || '(empty)';
  if (typeof v === 'number') return v.toLocaleString('en-IN');
  return JSON.stringify(v);
}

function humanTitle(entry: AuditEntry): string {
  switch (entry.action) {
    case 'UPDATE_FIELD':
      return `Field updated on ${entry.entityType}`;
    case 'COMMIT':
      return 'Commercial change committed';
    case 'ASSIGN':
      return 'Customer assigned';
    case 'UNASSIGN':
      return 'Customer unassigned';
    case 'LOGIN':
      return 'Sign-in';
    case 'LOGOUT':
      return 'Sign-out';
    case 'LOGIN_FAILED':
      return 'Sign-in attempt failed';
    case 'NOTIFY_ACCOUNTS_TEAM':
      return 'Accounts team notified';
    default:
      return entry.action.replace(/_/g, ' ').toLowerCase();
  }
}

function entityLink(entry: AuditEntry): string | null {
  if (entry.entityId === '00000000-0000-0000-0000-000000000000') return null;
  switch (entry.entityType) {
    case 'Account':
      return `/customers/${entry.entityId}/details`;
    case 'CommercialChange':
      return `/transactions?focus=${entry.entityId}`;
    case 'Meeting':
      return `/meetings/${entry.entityId}`;
    case 'User':
      return `/users`;
    default:
      return null;
  }
}
