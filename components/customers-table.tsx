'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  Eye,
  Users as UsersIcon,
  Fingerprint,
  Mail,
  Phone,
  Calendar,
  Handshake,
  FileText,
  Hash,
  Activity,
  UserCircle2,
  UserPlus,
} from 'lucide-react';
import { DataTable, type Column } from './data-table';
import { StatusPill, type PillTone } from './status-pill';
import type { Account, OwnerFilter } from '../services/accounts';
import type { AuthUser } from '../services/auth';
import { formatRupeesCompact } from '../lib/format-rupees';
import { derivePlanName } from '../lib/derive-plan';
import {
  STATUS_FILTERS,
  STATUS_FILTER_LABEL,
  type StatusFilter,
} from '../lib/status-filter';
import { AssignCustomerModal } from './assign-customer-modal';

const STATUS_TONE: Record<Account['contractStatus'], PillTone> = {
  ACTIVE: 'emerald',
  PENDING: 'amber',
  EXPIRED: 'gray',
  TERMINATED: 'red',
  PROBABLE_CHURN: 'amber',
  DISCONNECTING: 'red',
  PENDING_QUICK_APPROVAL: 'amber',
};

const STATUS_LABEL: Record<Account['contractStatus'], string> = {
  ACTIVE: 'Active',
  PENDING: 'Pending',
  EXPIRED: 'Expired',
  TERMINATED: 'Terminated',
  PROBABLE_CHURN: 'Probable Churn',
  DISCONNECTING: 'Disconnecting',
  PENDING_QUICK_APPROVAL: 'Pending Approval',
};

export function CustomersTable({
  accounts,
  currentUser,
  activeOwnerFilter = 'all',
  unassignedCount = 0,
  activeStatusFilter = 'all',
  statusCounts,
}: {
  accounts: Account[];
  currentUser?: AuthUser;
  activeOwnerFilter?: OwnerFilter;
  unassignedCount?: number;
  activeStatusFilter?: StatusFilter;
  /** Counts per status across the un-status-filtered set (so chip badges
   *  reflect what's available, not what the current filter shows). */
  statusCounts?: Record<StatusFilter, number>;
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<Account | null>(null);

  const canAssign = currentUser?.role === 'ADMIN' || currentUser?.role === 'SAM_HEAD';

  const columns: Column<Account>[] = [
    {
      key: 'expand',
      header: '',
      width: '32px',
      cell: (a) => (
        <span className="text-gray-400">
          {expandedId === a.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
      ),
    },
    {
      key: 'customerCode',
      header: 'Code',
      sortable: true,
      cell: (a) => (
        <Link
          href={`/customers/${a.id}`}
          onClick={(e) => e.stopPropagation()}
          className="hover:underline"
        >
          {a.customerCode ?? '—'}
        </Link>
      ),
      className: 'px-5 py-4 font-mono text-xs text-orange-600',
    },
    {
      key: 'clientName',
      header: 'Customer',
      sortable: true,
      cell: (a) => (
        <Link
          href={`/customers/${a.id}`}
          onClick={(e) => e.stopPropagation()}
          className="hover:text-brand-600"
        >
          {a.clientName}
        </Link>
      ),
      secondary: (a) => a.companyName ?? null,
    },
    {
      key: 'currentPlan',
      header: 'Plan',
      cell: (a) => derivePlanName(a),
      className: 'px-5 py-4 text-sm text-gray-500',
    },
    {
      key: 'bandwidthMbps',
      header: 'Bandwidth',
      align: 'right',
      cell: (a) => (a.bandwidthMbps != null ? `${a.bandwidthMbps} Mbps` : '—'),
      className: 'px-5 py-4 text-sm text-gray-500 text-right',
    },
    {
      key: 'kittyType',
      header: 'Kitty',
      cell: (a) => (
        <StatusPill tone={a.kittyType === 'BASE' ? 'orange' : 'emerald'}>{a.kittyType}</StatusPill>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      cell: (a) =>
        a.samOwner ? (
          <div className="flex items-center gap-1.5 text-sm text-gray-700">
            <UserCircle2 className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate">{a.samOwner.name}</span>
          </div>
        ) : (
          <StatusPill tone="amber">Unassigned</StatusPill>
        ),
      className: 'px-5 py-4',
    },
    {
      key: 'currentArc',
      header: 'Current ARC',
      sortable: true,
      align: 'right',
      cell: (a) => formatRupeesCompact(Number(a.currentArc)),
      className: 'px-5 py-4 text-sm font-medium text-gray-900 text-right',
    },
    {
      key: 'contractStatus',
      header: 'Status',
      cell: (a) => (
        <StatusPill tone={STATUS_TONE[a.contractStatus]}>{STATUS_LABEL[a.contractStatus]}</StatusPill>
      ),
    },
    {
      key: 'view',
      header: '',
      align: 'center' as const,
      cell: (a: Account) => (
        <Link
          href={`/customers/${a.id}/details`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-brand-300 hover:bg-orange-50 hover:text-brand-700 transition-all"
          aria-label={`View full details for ${a.clientName}`}
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </Link>
      ),
      className: 'px-5 py-4',
    },
    ...(canAssign
      ? [
          {
            key: 'actions',
            header: '',
            align: 'center' as const,
            cell: (a: Account) => {
              const isReassign = !!a.samOwner;
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAssignTarget(a);
                  }}
                  className={
                    isReassign
                      ? 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm transition-all'
                      : 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-b from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 shadow-sm hover:shadow ring-1 ring-brand-700/20 transition-all'
                  }
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {isReassign ? 'Reassign' : 'Assign'}
                </button>
              );
            },
            className: 'px-5 py-4',
          },
        ]
      : []),
  ];

  return (
    <>
      {canAssign && (
        <OwnerFilterBar
          active={activeOwnerFilter}
          unassignedCount={unassignedCount}
          isHead={currentUser?.role === 'SAM_HEAD'}
        />
      )}
      <StatusFilterBar active={activeStatusFilter} counts={statusCounts} />
      <DataTable<Account>
        title="Customers"
        totalCount={accounts.length}
        searchable
        searchPlaceholder="Search by name, code, mobile"
        searchKeys={['clientName', 'companyName', 'mobileNumber', 'customerCode', 'leadId']}
        pagination
        columns={columns}
        rows={accounts}
        rowKey={(a) => a.id}
        onRowClick={(a) => setExpandedId((cur) => (cur === a.id ? null : a.id))}
        isRowExpanded={(a) => expandedId === a.id}
        renderExpanded={(a) => <CustomerDetails account={a} />}
        emptyTitle={
          activeOwnerFilter === 'unassigned'
            ? 'No unassigned customers'
            : 'No customers yet'
        }
        emptySubtitle={
          activeOwnerFilter === 'unassigned'
            ? 'Every customer in scope already has an owner. New CRM activations will appear here.'
            : 'Import customers from /excel-import to populate the dashboard.'
        }
        emptyIcon={UsersIcon}
        minWidth="min-w-[1100px]"
      />
      <AssignCustomerModal
        account={assignTarget}
        open={assignTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAssignTarget(null);
            router.refresh();
          }
        }}
      />
    </>
  );
}

function OwnerFilterBar({
  active,
  unassignedCount,
  isHead,
}: {
  active: OwnerFilter;
  unassignedCount: number;
  isHead: boolean;
}) {
  const router = useRouter();
  const setFilter = (next: OwnerFilter) => {
    const url = new URL(window.location.href);
    if (next === 'all') url.searchParams.delete('owner');
    else url.searchParams.set('owner', next);
    router.push(`${url.pathname}?${url.searchParams.toString()}`);
  };

  const chips: { key: OwnerFilter; label: string; badge?: number }[] = [
    { key: 'all', label: 'All' },
    { key: 'unassigned', label: 'Unassigned', badge: unassignedCount },
    ...(isHead ? ([{ key: 'team', label: 'My team' }] as const) : []),
    { key: 'mine', label: 'Mine' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => {
        const isActive = active === c.key;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => setFilter(c.key)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isActive
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {c.label}
            {typeof c.badge === 'number' && c.badge > 0 && (
              <span
                className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-semibold ${
                  isActive ? 'bg-white text-brand-600' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {c.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Contract-status filter row. Sits below the owner filter, drives the
 * `?status=` URL param. Badge counts reflect the post-kitty/owner set
 * so the user sees what's available *within their current scope*.
 */
function StatusFilterBar({
  active,
  counts,
}: {
  active: StatusFilter;
  counts?: Record<StatusFilter, number>;
}) {
  const router = useRouter();
  const setFilter = (next: StatusFilter) => {
    const url = new URL(window.location.href);
    if (next === 'all') url.searchParams.delete('status');
    else url.searchParams.set('status', next);
    router.push(`${url.pathname}?${url.searchParams.toString()}`);
  };

  const chipTone: Record<StatusFilter, string> = {
    all: 'bg-amber-100 text-amber-700',
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    PENDING: 'bg-amber-100 text-amber-700',
    AT_RISK: 'bg-orange-100 text-orange-700',
    TERMINATED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mr-1">
        Status
      </span>
      {STATUS_FILTERS.map((key) => {
        const isActive = active === key;
        const badge = counts?.[key] ?? 0;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isActive
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {STATUS_FILTER_LABEL[key]}
            {badge > 0 && (
              <span
                className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-semibold ${
                  isActive ? 'bg-white text-brand-600' : chipTone[key]
                }`}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

type Tone = 'indigo' | 'emerald' | 'orange';

const TONE_STYLES: Record<
  Tone,
  { ring: string; iconBg: string; iconColor: string; label: string; accent: string }
> = {
  indigo: {
    ring: 'ring-indigo-100',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    label: 'text-indigo-700',
    accent: 'from-indigo-50/60',
  },
  emerald: {
    ring: 'ring-emerald-100',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    label: 'text-emerald-700',
    accent: 'from-emerald-50/60',
  },
  orange: {
    ring: 'ring-orange-100',
    iconBg: 'bg-orange-50',
    iconColor: 'text-brand-600',
    label: 'text-brand-600',
    accent: 'from-orange-50/60',
  },
};

function CustomerDetails({ account }: { account: Account }) {
  const metadataEntries = account.metadata ? Object.entries(account.metadata) : [];
  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/customers/${account.id}`}
        className="self-end inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-sm ring-1 ring-brand-700/20 transition-all"
      >
        View full journey
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <DetailCard title="Identifiers" icon={Fingerprint} tone="indigo">
        <Detail
          icon={Hash}
          label="Circuit ID"
          value={account.circuitId}
          mono
        />
        <Detail
          icon={FileText}
          label="External CRM ID"
          value={account.externalCrmId}
          mono
          truncate
        />
      </DetailCard>

      <DetailCard title="Contact" icon={Mail} tone="emerald">
        <Detail icon={Mail} label="Email" value={account.email} />
        <Detail icon={Phone} label="Mobile" value={account.mobileNumber} />
      </DetailCard>

      <DetailCard title="Lifecycle" icon={Activity} tone="orange">
        <Detail
          icon={UserCircle2}
          label="Owner"
          value={account.samOwner ? `${account.samOwner.name} · ${account.samOwner.email}` : null}
        />
        <Detail
          icon={Calendar}
          label="Onboarded"
          value={formatDate(account.onboardingDate)}
        />
        <Detail
          icon={Handshake}
          label="Last meeting"
          value={formatDate(account.lastMeetingDate)}
        />
        <Detail
          icon={FileText}
          label="Last MOM sent"
          value={formatDate(account.lastMomDate)}
        />
      </DetailCard>

      {metadataEntries.length > 0 && (
        <div className="md:col-span-3 mt-1 pt-3 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
            Imported metadata ({metadataEntries.length})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
            {metadataEntries.map(([key, value]) => (
              <Detail key={key} label={key} value={String(value)} />
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function DetailCard({
  title,
  icon: Icon,
  tone,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
  children: React.ReactNode;
}) {
  const t = TONE_STYLES[tone];
  return (
    <div
      className={`relative overflow-hidden bg-white rounded-xl ring-1 ${t.ring} shadow-sm hover:shadow-md transition-shadow`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${t.accent} to-transparent pointer-events-none`}
      />
      <div className="relative p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className={`w-8 h-8 rounded-lg ${t.iconBg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${t.iconColor}`} />
          </div>
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${t.label}`}
          >
            {title}
          </span>
        </div>
        <div className="flex flex-col gap-3.5">{children}</div>
      </div>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  mono = false,
  truncate = false,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  truncate?: boolean;
}) {
  const isEmpty = !value || value === '';
  return (
    <div className="flex items-start gap-3 min-w-0">
      {Icon && (
        <div className="w-7 h-7 rounded-md bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-3.5 h-3.5 text-gray-400" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">
          {label}
        </div>
        <div
          className={[
            'text-sm leading-tight',
            isEmpty ? 'text-gray-300 italic' : 'text-gray-900 font-medium',
            mono ? 'font-mono text-xs font-normal' : '',
            truncate ? 'truncate' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          title={truncate && !isEmpty ? value ?? undefined : undefined}
        >
          {isEmpty ? 'Not set' : value}
        </div>
      </div>
    </div>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-05-07" → "7 May 2026". Handles full ISO timestamps too. */
function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return value;
  const [, y, mo, d] = m;
  const monthIdx = Number(mo) - 1;
  if (monthIdx < 0 || monthIdx > 11) return value;
  return `${Number(d)} ${MONTHS[monthIdx]} ${y}`;
}
