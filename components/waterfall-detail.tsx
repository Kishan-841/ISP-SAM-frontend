'use client';

import { useRouter } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { DataTable, type Column } from './data-table';
import { ExpandableArc } from './expandable-arc';

export type WaterfallDetailInput = {
  startArcRupees: number;
  upgradesArcRupees: number;
  downgradesArcRupees: number;
  terminationsArcRupees: number;
  endArcRupees: number;
};

type WaterfallRow = {
  label: string;
  arc: number;
  tone: 'neutral' | 'positive' | 'negative' | 'final';
  sign?: '+' | '−' | '=';
  href: string;
  hrefHint: string;
};

const TONE_CLASS: Record<WaterfallRow['tone'], string> = {
  neutral: 'text-brand-600',
  positive: 'text-emerald-600',
  negative: 'text-red-600',
  final: 'text-gray-900 font-semibold',
};

const SIGN_BG: Record<NonNullable<WaterfallRow['sign']>, string> = {
  '+': 'bg-emerald-50 text-emerald-700',
  '−': 'bg-red-50 text-red-700',
  '=': 'bg-gray-100 text-gray-700',
};

export function WaterfallDetail({
  input,
  kittyType = 'BASE',
}: {
  input: WaterfallDetailInput;
  /** Drives the start/end labels and the customer-list deep-links so the
   *  same component can render an Existing-Base or New-Base detail table. */
  kittyType?: 'BASE' | 'NEW';
}) {
  const router = useRouter();
  const isNew = kittyType === 'NEW';

  const rows: WaterfallRow[] = [
    {
      label: isNew ? 'At onboarding' : 'Start of Period',
      arc: input.startArcRupees,
      tone: 'neutral',
      href: `/customers?kittyType=${kittyType}`,
      hrefHint: isNew ? 'See all New-Base customers' : 'See all April 1 Base customers',
    },
    {
      label: 'Upgrades',
      arc: input.upgradesArcRupees,
      tone: 'positive',
      sign: '+',
      href: '/transactions?type=UPGRADE',
      hrefHint: 'See upgrade transactions',
    },
    {
      label: 'Downgrades',
      arc: input.downgradesArcRupees,
      tone: 'negative',
      sign: '−',
      href: '/transactions?type=DOWNGRADE',
      hrefHint: 'See downgrade transactions',
    },
    {
      label: 'Disconnections',
      arc: input.terminationsArcRupees,
      tone: 'negative',
      sign: '−',
      href: '/transactions?type=DISCONNECTION',
      hrefHint: 'See termination transactions',
    },
    {
      label: isNew ? 'Today' : 'End of Period',
      arc: input.endArcRupees,
      tone: 'final',
      sign: '=',
      href: `/customers?kittyType=${kittyType}&status=ACTIVE`,
      hrefHint: isNew
        ? 'See current active New-Base customers'
        : 'See current active Base customers',
    },
  ];

  const columns: Column<WaterfallRow>[] = [
    {
      key: 'component',
      header: 'Component',
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[11px] font-semibold ${
              row.sign ? SIGN_BG[row.sign] : 'bg-orange-50 text-brand-600'
            }`}
            aria-hidden="true"
          >
            {row.sign ?? '·'}
          </span>
          <span className={`${TONE_CLASS[row.tone]} ${row.tone === 'final' ? 'text-sm' : ''}`}>
            {row.label}
          </span>
        </div>
      ),
    },
    {
      key: 'arc',
      header: 'ARC',
      align: 'right',
      cell: (row) => (
        <ExpandableArc
          value={row.arc}
          className={
            row.tone === 'final'
              ? 'text-gray-900 font-bold text-base'
              : `font-medium ${TONE_CLASS[row.tone]}`
          }
        />
      ),
    },
    {
      key: 'open',
      header: '',
      width: '3rem',
      align: 'right',
      cell: (row) => (
        <span className="text-gray-300 group-hover:text-gray-500 transition-colors" title={row.hrefHint}>
          <ArrowUpRight className="w-4 h-4" />
        </span>
      ),
    },
  ];

  return (
    <DataTable<WaterfallRow>
      columns={columns}
      rows={rows}
      rowKey={(r) => r.label}
      onRowClick={(row) => router.push(row.href)}
    />
  );
}
