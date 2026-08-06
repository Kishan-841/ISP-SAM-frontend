import { redirect } from 'next/navigation';
import { MessageSquareText } from 'lucide-react';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { getMe } from '../../services/auth';
import { listFeedbacks, type FeedbackListRow } from '../../services/feedback';
import { PageHeader } from '../../components/page-header';
import { FeedbacksView } from '../../components/feedbacks-view';

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
      ) : (
        <FeedbacksView rows={rows} />
      )}
    </div>
  );
}
