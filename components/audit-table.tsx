'use client';

import { useState } from 'react';
import {
  Globe,
  LogIn,
  LogOut,
  Mail,
  Pencil,
  Plus,
  ShieldX,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusPill, type PillTone } from './status-pill';
import { AuditDetailSheet } from './audit-detail-sheet';
import type { AuditEntry } from '../services/audit';

type ActionMeta = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: PillTone;
};

const ACTION_META: Record<string, ActionMeta> = {
  COMMIT: { label: 'Commercial change', icon: Plus, tone: 'emerald' },
  ASSIGN: { label: 'Assigned', icon: UserPlus, tone: 'blue' },
  UNASSIGN: { label: 'Unassigned', icon: UserMinus, tone: 'amber' },
  UPDATE_FIELD: { label: 'Field edit', icon: Pencil, tone: 'orange' },
  LOGIN: { label: 'Login', icon: LogIn, tone: 'emerald' },
  LOGOUT: { label: 'Logout', icon: LogOut, tone: 'gray' },
  LOGIN_FAILED: { label: 'Failed login', icon: ShieldX, tone: 'red' },
  NOTIFY_ACCOUNTS_TEAM: { label: 'Notify accounts', icon: Mail, tone: 'purple' },
};

const FALLBACK_META: ActionMeta = {
  label: '',
  icon: Pencil,
  tone: 'gray',
};

function describePayload(e: AuditEntry): React.ReactNode {
  const p = (e.payload as Record<string, unknown>) ?? null;
  if (!p) return <span className="text-gray-400">—</span>;

  if (e.action === 'UPDATE_FIELD' && typeof p.field === 'string') {
    return (
      <span className="text-sm">
        <span className="font-medium text-gray-900">{p.field}</span>
        <span className="text-gray-400">: </span>
        <span className="line-through text-gray-400">{fmtValue(p.from)}</span>
        <span className="text-gray-400 mx-1">→</span>
        <span className="text-gray-900">{fmtValue(p.to)}</span>
      </span>
    );
  }
  if (e.action === 'COMMIT') {
    const oldA = p.oldArc as number | undefined;
    const newA = p.newArc as number | undefined;
    return (
      <span className="text-sm">
        <span className="font-medium">{labelType(p.changeType as string)}</span>
        {oldA != null && newA != null && (
          <>
            <span className="text-gray-400"> · </span>
            ₹{oldA.toLocaleString('en-IN')}
            <span className="text-gray-400"> → </span>
            ₹{newA.toLocaleString('en-IN')}
          </>
        )}
      </span>
    );
  }
  if (e.action === 'LOGIN') {
    return (
      <span className="text-sm">
        <span className="font-mono text-xs">{String(p.email ?? '')}</span>
        {p.role ? (
          <span className="ml-2 text-[10px] uppercase tracking-wider text-gray-500">
            {String(p.role)}
          </span>
        ) : null}
      </span>
    );
  }
  if (e.action === 'LOGIN_FAILED') {
    return (
      <span className="text-sm">
        tried <span className="font-mono text-xs">{String(p.emailAttempted ?? '')}</span>
        {p.reason ? (
          <span className="ml-2 text-xs text-gray-500">{String(p.reason)}</span>
        ) : null}
      </span>
    );
  }
  if (e.action === 'NOTIFY_ACCOUNTS_TEAM') {
    const outcome = String(p.outcome ?? '');
    const detail = p.detail ? String(p.detail) : '';
    const tone =
      outcome === 'SENT'
        ? 'bg-emerald-50 text-emerald-700'
        : outcome === 'SKIPPED'
          ? 'bg-gray-100 text-gray-600'
          : 'bg-red-50 text-red-700';
    return (
      <span className="text-sm">
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${tone}`}
        >
          {outcome || 'UNKNOWN'}
        </span>
        {detail && <span className="ml-2 text-xs text-gray-500">{detail}</span>}
      </span>
    );
  }
  if (e.action === 'ASSIGN' || e.action === 'UNASSIGN') {
    return (
      <span className="text-sm text-gray-600">
        owner: <span className="font-mono text-xs">{String(p.from ?? '—').slice(0, 8)}</span>
        <span className="mx-1 text-gray-400">→</span>
        <span className="font-mono text-xs">{String(p.to ?? '—').slice(0, 8)}</span>
      </span>
    );
  }
  // Generic JSON dump
  return (
    <span className="text-xs text-gray-500 font-mono break-all line-clamp-2">
      {JSON.stringify(p)}
    </span>
  );
}

function fmtValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v || '—';
  if (typeof v === 'number') return v.toLocaleString('en-IN');
  return JSON.stringify(v);
}

function labelType(t?: string): string {
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
      return t ?? '';
  }
}

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

function formatTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : DATE_FMT.format(d).toLowerCase();
}

export function AuditTable({ entries }: { entries: AuditEntry[] }) {
  const [selected, setSelected] = useState<AuditEntry | null>(null);

  return (
    <>
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">When</TableHead>
              <TableHead className="w-48">Who</TableHead>
              <TableHead className="w-44">Action</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="w-40">Entity</TableHead>
              <TableHead className="w-32">IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e) => {
              const meta = {
                ...(ACTION_META[e.action] ?? FALLBACK_META),
                label:
                  ACTION_META[e.action]?.label ?? e.action.replace(/_/g, ' ').toLowerCase(),
              };
              const Icon = meta.icon;
              return (
                <TableRow
                  key={e.id}
                  onClick={() => setSelected(e)}
                  className="cursor-pointer hover:bg-orange-50/50 transition-colors"
                  aria-label={`View details for ${meta.label} event`}
                >
                  <TableCell className="text-xs text-gray-500 align-top">
                    {formatTime(e.timestamp)}
                  </TableCell>
                  <TableCell className="align-top">
                    {e.performer ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {e.performer.name}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {e.performer.role}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        {e.performedBy ? 'unknown user' : 'system / anonymous'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded ${pillBg(meta.tone)}`}
                      >
                        <Icon className={`w-3 h-3 ${pillFg(meta.tone)}`} />
                      </span>
                      <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                    </span>
                  </TableCell>
                  <TableCell className="align-top max-w-md">
                    {describePayload(e)}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-gray-500">{e.entityType}</span>
                      <span className="font-mono text-[11px] text-gray-400">
                        {e.entityId.slice(0, 8)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    {e.ipAddress ? (
                      <span
                        className="inline-flex items-center gap-1 text-xs font-mono text-gray-600"
                        title={e.userAgent ?? undefined}
                      >
                        <Globe className="w-3 h-3 text-gray-400" />
                        {e.ipAddress}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
    <AuditDetailSheet
      entry={selected}
      open={selected !== null}
      onOpenChange={(o) => {
        if (!o) setSelected(null);
      }}
    />
    </>
  );
}

function pillBg(tone: PillTone): string {
  return (
    {
      emerald: 'bg-emerald-50',
      red: 'bg-red-50',
      amber: 'bg-amber-50',
      orange: 'bg-orange-50',
      blue: 'bg-blue-50',
      gray: 'bg-gray-100',
      purple: 'bg-purple-50',
    } satisfies Record<PillTone, string>
  )[tone];
}
function pillFg(tone: PillTone): string {
  return (
    {
      emerald: 'text-emerald-600',
      red: 'text-red-600',
      amber: 'text-amber-600',
      orange: 'text-orange-600',
      blue: 'text-blue-600',
      gray: 'text-gray-600',
      purple: 'text-purple-600',
    } satisfies Record<PillTone, string>
  )[tone];
}
