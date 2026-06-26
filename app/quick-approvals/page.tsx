import { redirect } from 'next/navigation';
import { getMe } from '../../services/auth';
import { getPendingQuickApprovals } from '../../services/commercial-changes';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { PageHeader } from '../../components/page-header';
import { QuickApprovalsList } from '../../components/quick-approvals-list';

/**
 * Queue for QUICK-disconnect requests on BASE-kitty customers.
 *
 * ADMIN sees every pending request; SAM_HEAD sees only their own + their
 * team's (scoped server-side). NEW-kitty quick disconnects continue to
 * route through the CRM admin queue (handled by the CRM webhook) and
 * don't appear here.
 */
export default async function QuickApprovalsPage() {
  const cookieHeader = await getCookieHeader();
  const me = await getMe({ cookieHeader });
  if (me.user.role !== 'ADMIN' && me.user.role !== 'SAM_HEAD') {
    redirect('/');
  }

  const { items, total } = await getPendingQuickApprovals({ cookieHeader });
  const teamScoped = me.user.role === 'SAM_HEAD';

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl flex flex-col gap-6">
      <PageHeader
        title="Quick disconnect approvals"
        subtitle={
          total === 0
            ? 'No pending requests — existing-base SAMs will see new requests appear here.'
            : `${total} ${total === 1 ? 'request' : 'requests'} awaiting your decision · BASE kitty only${
                teamScoped ? ' · your team' : ''
              }`
        }
      />
      <QuickApprovalsList items={items} />
    </div>
  );
}
