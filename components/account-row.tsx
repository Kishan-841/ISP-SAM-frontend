'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Account } from '../services/accounts';
import { StatusPill, type PillTone } from './status-pill';
import { dataTableClasses } from './data-table';

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

export function AccountRow({ account }: { account: Account }) {
  const [open, setOpen] = useState(false);
  const arc = Number(account.currentMrr) * 12;
  const metadataEntries = account.metadata ? Object.entries(account.metadata) : [];

  return (
    <>
      <tr
        className={`${dataTableClasses.tr} cursor-pointer`}
        onClick={() => setOpen((o) => !o)}
      >
        <td className="px-5 py-4 text-gray-400 w-8">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </td>
        <td className="px-5 py-4 font-mono text-xs text-orange-600">
          {account.customerCode ?? '—'}
        </td>
        <td className="px-5 py-4">
          <div className={dataTableClasses.twoLine.primary}>{account.clientName}</div>
          {account.companyName && (
            <div className={dataTableClasses.twoLine.secondary}>{account.companyName}</div>
          )}
        </td>
        <td className={dataTableClasses.tdSecondary}>{account.companyName ?? '—'}</td>
        <td className={dataTableClasses.tdSecondary}>{account.currentPlan ?? '—'}</td>
        <td className={`${dataTableClasses.tdSecondary} text-right`}>
          {account.bandwidthMbps != null ? `${account.bandwidthMbps} Mbps` : '—'}
        </td>
        <td className="px-5 py-4">
          <StatusPill tone={account.kittyType === 'BASE' ? 'orange' : 'emerald'}>
            {account.kittyType}
          </StatusPill>
        </td>
        <td className={`${dataTableClasses.tdPrimary} text-right`}>
          ₹{Number(account.currentMrr).toLocaleString('en-IN')}
        </td>
        <td className="px-5 py-4">
          <StatusPill tone={STATUS_TONE[account.contractStatus]}>
            {STATUS_LABEL[account.contractStatus]}
          </StatusPill>
        </td>
      </tr>
      {open && (
        <tr className="bg-gray-50/60">
          <td className="px-5 py-4" colSpan={9}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-sm">
              <Detail label="Circuit ID" value={account.circuitId} mono />
              <Detail label="Lead ID" value={account.leadId} />
              <Detail label="External CRM ID" value={account.externalCrmId} />
              <Detail label="Mobile" value={account.mobileNumber} />
              <Detail label="Onboarded" value={formatDate(account.onboardingDate)} />
              <Detail label="ARC (annual)" value={`₹${arc.toLocaleString('en-IN')}`} />
              <Detail
                label="Start-of-period MRR"
                value={
                  account.startOfPeriodMrr != null
                    ? `₹${Number(account.startOfPeriodMrr).toLocaleString('en-IN')}`
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
          </td>
        </tr>
      )}
    </>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string | null | undefined; mono?: boolean }) {
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
