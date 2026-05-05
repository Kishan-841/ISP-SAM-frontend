'use client';

import { useRouter } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { DataTable, type Column } from './data-table';
import { formatRupees, formatRupeesCompact } from '../lib/format-rupees';

export type WaterfallDetailInput = {
  startArcRupees: number;
  upgradesArcRupees: number;
  downgradesArcRupees: number;
  rateRevisionsArcRupees: number;
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

export function WaterfallDetail({ input }: { input: WaterfallDetailInput }) {
  const router = useRouter();

  const rows: WaterfallRow[] = [
    {
      label: 'Start of Period',
      arc: input.startArcRupees,
      tone: 'neutral',
      href: '/customers?kittyType=BASE',
      hrefHint: 'See all April 1 Base customers',
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
      label: 'Rate Revisions (↓)',
      arc: input.rateRevisionsArcRupees,
      tone: 'negative',
      sign: '−',
      href: '/transactions?type=RATE_REVISION',
      hrefHint: 'See rate revision transactions',
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
      label: 'End of Period',
      arc: input.endArcRupees,
      tone: 'final',
      sign: '=',
      href: '/customers?kittyType=BASE&status=ACTIVE',
      hrefHint: 'See current active Base customers',
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
        <span
          className={`tabular-nums ${
            row.tone === 'final'
              ? 'text-gray-900 font-bold text-base'
              : `font-medium ${TONE_CLASS[row.tone]}`
          }`}
          title={formatRupees(row.arc)}
        >
          {formatRupeesCompact(row.arc)}
        </span>
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
