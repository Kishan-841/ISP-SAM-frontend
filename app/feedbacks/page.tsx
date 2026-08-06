import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, MessageSquareText, Star } from 'lucide-react';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { getMe } from '../../services/auth';
import { listFeedbacks, type FeedbackListRow } from '../../services/feedback';
import { PageHeader } from '../../components/page-header';
import { formatDateTime } from '../../lib/format-date';
import { InterestPill } from '../../components/interest-pill';

const ALLOWED = ['ADMIN', 'SUPER_ADMIN_2', 'SAM_HEAD'] as const;

export default async function FeedbacksPage() {
  const cookieHeader = await getCookieHeader();
  const me = await getMe({ cookieHeader });
  if (!(ALLOWED as readonly string[]).includes(me.user.role)) {
    redirect('/');
  }

  let rows: FeedbackListRow[] = [];
  let loadError = false;
  try {
    rows = (await listFeedbacks({ cookieHeader })).feedbacks;
  } catch {
    loadError = true;
  }

  const avg =
    rows.filter((r) => r.overallScore !== null).length > 0
      ? rows.reduce((s, r) => s + (r.overallScore ?? 0), 0) /
        rows.filter((r) => r.overallScore !== null).length
      : null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl flex flex-col gap-6">
      <PageHeader
        title="Feedbacks"
        subtitle={
          rows.length === 0
            ? 'Customer feedback submissions will appear here.'
            : `${rows.length} response${rows.length === 1 ? '' : 's'}${avg !== null ? ` · avg score ${avg.toFixed(2)} / 5` : ''}`
        }
      />

      {loadError ? (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 p-8 text-center">
          <MessageSquareText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">Feedback isn&apos;t available yet</p>
          <p className="text-xs text-gray-500 mt-1">
            This view needs the latest backend. If it was just deployed, refresh shortly.
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 p-8 text-center">
          <MessageSquareText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">No feedback yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Share the feedback link with customers when you send a MOM.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[820px]">
              <thead className="bg-gray-50/60 border-b border-gray-100">
                <tr>
                  <Th>Customer</Th>
                  <Th>Company</Th>
                  <Th>SAM</Th>
                  <Th align="center">Score</Th>
                  <Th align="center">Interest</Th>
                  <Th align="center">NPS</Th>
                  <Th>Submitted</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{r.customerName}</td>
                    <td className="px-5 py-3.5 text-gray-700">{r.companyName}</td>
                    <td className="px-5 py-3.5 text-gray-700">{r.sam.name}</td>
                    <td className="px-5 py-3.5 text-center tabular-nums font-medium text-gray-900">
                      {r.overallScore !== null ? (
                        <span className="inline-flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500" />
                          {r.overallScore.toFixed(1)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <InterestPill level={r.interestLevel} />
                    </td>
                    <td className="px-5 py-3.5 text-center tabular-nums text-gray-700">
                      {r.npsScore ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                      {formatDateTime(r.submittedAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/feedbacks/${r.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                      >
                        View <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  align = 'left',
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right' | 'center';
}) {
  const alignCls =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th
      className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-900 whitespace-nowrap ${alignCls}`}
    >
      {children}
    </th>
  );
}
