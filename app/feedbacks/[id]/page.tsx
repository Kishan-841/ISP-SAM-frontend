import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft, Star } from 'lucide-react';
import { getCookieHeader } from '../../../lib/get-cookie-header';
import { getMe } from '../../../services/auth';
import { getFeedback, type FeedbackDetail, type FeedbackQuestion } from '../../../services/feedback';
import { PageHeader } from '../../../components/page-header';
import { formatDateTime } from '../../../lib/format-date';
import { InterestPill } from '../../../components/interest-pill';

const ALLOWED = ['ADMIN', 'SUPER_ADMIN_2', 'SAM_HEAD'] as const;

const SECTION_TITLES: Record<number, string> = {
  1: 'Customer Information',
  2: 'Internet Service Feedback',
  3: 'Additional Services',
  4: 'Business Requirements',
};

export default async function FeedbackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieHeader = await getCookieHeader();
  const me = await getMe({ cookieHeader });
  if (!(ALLOWED as readonly string[]).includes(me.user.role)) {
    redirect('/');
  }

  const { id } = await params;
  let fb: FeedbackDetail | null = null;
  try {
    fb = await getFeedback(id, { cookieHeader });
  } catch {
    fb = null;
  }
  if (!fb) notFound();

  const sections = [...new Set(fb.questions.map((q) => q.section))].sort((a, b) => a - b);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-3xl flex flex-col gap-6">
      <Link
        href="/feedbacks"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Feedbacks
      </Link>

      <PageHeader
        title={fb.customerName}
        subtitle={`${fb.companyName} · SAM: ${fb.sam.name} · ${formatDateTime(fb.submittedAt)}`}
      />

      {/* Score summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Overall score">
          {fb.overallScore !== null ? (
            <span className="inline-flex items-center gap-1.5 text-2xl font-bold text-gray-900">
              <Star className="w-5 h-5 text-amber-500" />
              {fb.overallScore.toFixed(1)}
              <span className="text-sm font-normal text-gray-400">/ 5</span>
            </span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </SummaryCard>
        <SummaryCard label="Interest level">
          <InterestPill level={fb.interestLevel} />
        </SummaryCard>
        <SummaryCard label="Recommend (NPS)">
          <span className="text-2xl font-bold text-gray-900">
            {fb.npsScore ?? '—'}
            {fb.npsScore !== null && <span className="text-sm font-normal text-gray-400"> / 10</span>}
          </span>
        </SummaryCard>
      </div>

      {/* Answers by section */}
      {sections.map((sectionId) => {
        const qs = fb!.questions.filter(
          (q) => q.section === sectionId && hasAnswer(fb!.responses[q.id]),
        );
        if (qs.length === 0) return null;
        return (
          <section
            key={sectionId}
            className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden"
          >
            <header className="bg-gray-50/60 border-b border-gray-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-gray-900">
                {SECTION_TITLES[sectionId] ?? `Section ${sectionId}`}
              </h2>
            </header>
            <dl className="divide-y divide-gray-100">
              {qs.map((q) => (
                <div key={q.id} className="px-5 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                  <dt className="text-xs text-gray-500 sm:col-span-1">{q.label}</dt>
                  <dd className="text-sm text-gray-900 sm:col-span-2">
                    {renderAnswer(q, fb!.responses[q.id], fb!.ratingLabels, fb!.sam.name)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
}

function SummaryCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-200 px-5 py-4">
      <p className="text-xs text-gray-500 mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function hasAnswer(v: unknown): boolean {
  if (v === undefined || v === null || v === '') return false;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function renderAnswer(
  q: FeedbackQuestion,
  value: unknown,
  ratingLabels: Record<string, string>,
  samName?: string,
): React.ReactNode {
  // "Your SAM" is stored as the SAM's id — show the resolved name instead.
  if (q.type === 'sam') return <span>{samName ?? String(value)}</span>;
  if (q.type === 'rating5' && typeof value === 'number') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="font-semibold">{value}</span>
        <span className="text-gray-500">/ 5 · {ratingLabels[String(value)]}</span>
      </span>
    );
  }
  if (q.type === 'nps' && typeof value === 'number') {
    return <span className="font-semibold">{value} / 10</span>;
  }
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((v, i) => (
          <span
            key={i}
            className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-50 text-gray-800 text-xs ring-1 ring-orange-100"
          >
            {String(v)}
          </span>
        ))}
      </div>
    );
  }
  return <span className="whitespace-pre-line">{String(value)}</span>;
}
