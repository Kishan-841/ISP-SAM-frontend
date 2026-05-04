'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Users as UsersIcon } from 'lucide-react';
import { DataTable, type Column } from './data-table';
import { StatusPill, type PillTone } from './status-pill';
import type { Account } from '../services/accounts';
import { formatRupeesCompact } from '../lib/format-rupees';

const STATUS_TONE: Record<Account['contractStatus'], PillTone> = {
  ACTIVE: 'emerald',
  PENDING: 'amber',
  EXPIRED: 'gray',
  TERMINATED: 'red',
};

const STATUS_LABEL: Record<Account['contractStatus'], string> = {
  ACTIVE: 'Active',
  PENDING: 'Pending',
  EXPIRED: 'Expired',
  TERMINATED: 'Terminated',
};

export function CustomersTable({ accounts }: { accounts: Account[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      cell: (a) => a.customerCode ?? '—',
      className: 'px-5 py-4 font-mono text-xs text-orange-600',
    },
    {
      key: 'clientName',
      header: 'Customer',
      sortable: true,
      cell: (a) => a.clientName,
      secondary: (a) => a.companyName ?? null,
    },
    {
      key: 'companyName',
      header: 'Company',
      cell: (a) => a.companyName ?? '—',
      className: 'px-5 py-4 text-sm text-gray-500',
    },
    {
      key: 'currentPlan',
      header: 'Plan',
      cell: (a) => a.currentPlan ?? '—',
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
      key: 'currentMrr',
      header: 'Current ARC',
      sortable: true,
      align: 'right',
      cell: (a) => formatRupeesCompact(Number(a.currentMrr)),
      className: 'px-5 py-4 text-sm font-medium text-gray-900 text-right',
    },
    {
      key: 'contractStatus',
      header: 'Status',
      cell: (a) => (
        <StatusPill tone={STATUS_TONE[a.contractStatus]}>{STATUS_LABEL[a.contractStatus]}</StatusPill>
      ),
    },
  ];

  return (
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
      emptyTitle="No customers yet"
      emptySubtitle="Import customers from /excel-import to populate the dashboard."
      emptyIcon={UsersIcon}
      minWidth="min-w-[1100px]"
    />
  );
}

function CustomerDetails({ account }: { account: Account }) {
  const metadataEntries = account.metadata ? Object.entries(account.metadata) : [];
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-sm">
        <Detail label="Circuit ID" value={account.circuitId} mono />
        <Detail label="Lead ID" value={account.leadId} />
        <Detail label="External CRM ID" value={account.externalCrmId} />
        <Detail label="Email" value={account.email} />
        <Detail label="Mobile" value={account.mobileNumber} />
        <Detail label="Onboarded" value={formatDate(account.onboardingDate)} />
        <Detail
          label="Start-of-period ARC"
          value={
            account.startOfPeriodMrr != null
              ? formatRupeesCompact(Number(account.startOfPeriodMrr))
              : null
          }
        />
        <Detail label="Last meeting" value={formatDate(account.lastMeetingDate)} />
        <Detail label="Last MOM sent" value={formatDate(account.lastMomDate)} />
      </div>
      {metadataEntries.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
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
  );
}

function Detail({
  label, value, mono = false,
}: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-gray-900 ${mono ? 'font-mono text-xs' : ''}`}>
        {value && value !== '' ? value : '—'}
      </div>
    </div>
  );
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : value;
}
