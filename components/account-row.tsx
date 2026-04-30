'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Account } from '../services/accounts';

const STATUS_COLOR: Record<Account['contractStatus'], string> = {
  ACTIVE: 'text-emerald-700',
  PENDING: 'text-amber-700',
  EXPIRED: 'text-gray-600',
  TERMINATED: 'text-red-700',
};

export function AccountRow({ account }: { account: Account }) {
  const [open, setOpen] = useState(false);
  const kittyColor =
    account.kittyType === 'BASE'
      ? 'bg-brand-100 text-brand-900'
      : 'bg-emerald-100 text-emerald-800';

  const arc = Number(account.currentMrr) * 12;
  const metadataEntries = account.metadata ? Object.entries(account.metadata) : [];

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <td className="px-3 py-3 text-gray-400">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </td>
        <td className="px-3 py-3 font-mono text-xs text-brand-700">{account.customerCode ?? '—'}</td>
        <td className="px-3 py-3 font-medium">{account.clientName}</td>
        <td className="px-3 py-3 text-gray-600">{account.companyName ?? '—'}</td>
        <td className="px-3 py-3 text-gray-600">{account.currentPlan ?? '—'}</td>
        <td className="px-3 py-3 text-right text-gray-600">
          {account.bandwidthMbps != null ? `${account.bandwidthMbps} Mbps` : '—'}
        </td>
        <td className="px-3 py-3">
          <span className={`px-2 py-1 rounded text-xs font-semibold ${kittyColor}`}>
            {account.kittyType}
          </span>
        </td>
        <td className="px-3 py-3 text-right">₹{Number(account.currentMrr).toLocaleString('en-IN')}</td>
        <td className={`px-3 py-3 text-xs font-semibold ${STATUS_COLOR[account.contractStatus]}`}>
          {account.contractStatus}
        </td>
      </tr>
      {open && (
        <tr className="border-b border-gray-100 bg-gray-50/60">
          <td className="px-3 py-4" colSpan={9}>
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
