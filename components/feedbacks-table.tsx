'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Star, MessageSquareText } from 'lucide-react';
import { DataTable, type Column } from './data-table';
import { InterestPill } from './interest-pill';
import { formatDateTime } from '../lib/format-date';
import type { FeedbackListRow } from '../services/feedback';

export function FeedbacksTable({ rows }: { rows: FeedbackListRow[] }) {
  const router = useRouter();

  const columns: Column<FeedbackListRow>[] = [
    {
      key: 'customerName',
      header: 'Customer',
      sortable: true,
      cell: (r) => <span className="font-medium text-gray-900">{r.customerName}</span>,
    },
    {
      key: 'companyName',
      header: 'Company',
      sortable: true,
      cell: (r) => <span className="text-gray-700">{r.companyName}</span>,
    },
    {
      key: 'sam.name',
      header: 'SAM',
      sortable: true,
      cell: (r) => <span className="text-gray-700">{r.sam.name}</span>,
    },
    {
      key: 'overallScore',
      header: 'Score',
      align: 'center',
      sortable: true,
      cell: (r) =>
        r.overallScore !== null ? (
          <span className="inline-flex items-center gap-1 tabular-nums font-medium text-gray-900">
            <Star className="w-3.5 h-3.5 text-amber-500" />
            {r.overallScore.toFixed(1)}
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
    {
      key: 'interestLevel',
      header: 'Interest',
      align: 'center',
      sortable: true,
      cell: (r) => <InterestPill level={r.interestLevel} />,
    },
    {
      key: 'npsScore',
      header: 'NPS',
      align: 'center',
      sortable: true,
      cell: (r) => <span className="tabular-nums text-gray-700">{r.npsScore ?? '—'}</span>,
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      sortable: true,
      cell: (r) => <span className="text-gray-500 whitespace-nowrap">{formatDateTime(r.submittedAt)}</span>,
    },
  ];

  return (
    <DataTable<FeedbackListRow>
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      searchable
      searchPlaceholder="Search customer, company or SAM…"
      searchKeys={['customerName', 'companyName', 'sam.name']}
      pagination
      defaultPageSize={10}
      minWidth="min-w-[820px]"
      onRowClick={(r) => router.push(`/feedbacks/${r.id}`)}
      emptyIcon={MessageSquareText}
      emptyTitle="No feedback yet"
      emptySubtitle="Share the feedback link with customers when you send a MOM."
      actions={(r) => (
        <Link
          href={`/feedbacks/${r.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          View <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    />
  );
}
