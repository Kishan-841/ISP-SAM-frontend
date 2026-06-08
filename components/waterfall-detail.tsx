'use client';

import { useRouter } from 'next/navigation';
import { ArrowUpRight, Clock } from 'lucide-react';
import { DataTable, type Column } from './data-table';
import { ExpandableArc } from './expandable-arc';

export type WaterfallDetailInput = {
  startArcRupees: number;
  upgradesArcRupees: number;
  downgradesArcRupees: number;
  terminationsArcRupees: number;
  endArcRupees: number;
  /**
   * Net ARC adjustment of changes committed-but-not-applied (CRM still
   * working through them). When non-zero, a "Pending CRM settlement" row
   * is inserted between Disconnections and End-of-Period so the waterfall
   * sum lines up with the live Current ARC card. Omit / zero = no row.
   */
  pendingArcRupees?: number;
  /** Count of commercial changes still in CRM workflow — used for tooltip copy. */
  pendingCount?: number;
};

type WaterfallRow = {
  label: string;
  arc: number;
  tone: 'neutral' | 'positive' | 'negative' | 'final' | 'pending';
  sign?: '+' | '−' | '=' | '⏳';
  href: string;
  hrefHint: string;
};

const TONE_CLASS: Record<WaterfallRow['tone'], string> = {
  neutral: 'text-brand-600',
  positive: 'text-emerald-600',
  negative: 'text-red-600',
  final: 'text-gray-900 font-semibold',
  pending: 'text-amber-700',
};

const SIGN_BG: Record<NonNullable<WaterfallRow['sign']>, string> = {
  '+': 'bg-emerald-50 text-emerald-700',
  '−': 'bg-red-50 text-red-700',
  '=': 'bg-gray-100 text-gray-700',
  '⏳': 'bg-amber-50 text-amber-700',
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

  // Display pending row only when the rounded adjustment is materially
  // non-zero. Floats can leave ±₹500 noise from the backend's roundLakh,
  // so threshold at ₹1K to avoid a "Pending: ₹0" row appearing for no
  // visible reason.
  const showPending =
    input.pendingArcRupees != null && Math.abs(input.pendingArcRupees) >= 1_000;

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
    ...(showPending
      ? [
          {
            // Adjustment that brings the bucket sum back in line with the
            // live currentArc. Drill-through goes to /transactions filtered
            // to in-flight rows (no accountAppliedAt yet).
            label:
              input.pendingCount && input.pendingCount > 0
                ? `Pending CRM settlement (${input.pendingCount})`
                : 'Pending CRM settlement',
            arc: input.pendingArcRupees!,
            tone: 'pending' as const,
            sign: '⏳' as const,
            href: '/transactions?status=in-flight',
            hrefHint:
              'Commercial changes committed but not yet COMPLETED in CRM — their ARC isn’t on accounts yet',
          },
        ]
      : []),
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
            {row.sign === '⏳' ? <Clock className="w-3 h-3" /> : row.sign ?? '·'}
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
