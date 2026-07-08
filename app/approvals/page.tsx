import { redirect } from 'next/navigation';
import { getMe } from '../../services/auth';
import { getPendingApprovals } from '../../services/commercial-changes';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { PageHeader } from '../../components/page-header';
import { ApprovalsList } from '../../components/approvals-list';

/**
 * Internal approval queue for BASE (existing-base) commercial changes.
 *
 * Each approver sees only the stage they own:
 *   SUPER_ADMIN_2 → first-stage disconnection sign-off
 *   SAM_HEAD      → quick-disconnect sign-off (their team only)
 *   ACCOUNTS      → final commercial sign-off (applies the change)
 *   ADMIN         → the whole pipeline
 *
 * NEW-base changes never appear here — they route straight to CRM.
 */
const ALLOWED_ROLES = ['ADMIN', 'SUPER_ADMIN_2', 'SAM_HEAD', 'ACCOUNTS'] as const;

const STAGE_HINT: Record<string, string> = {
  ADMIN: 'every pending stage across all SAMs',
  SUPER_ADMIN_2: 'first-stage disconnection sign-offs',
  SAM_HEAD: 'quick-disconnect sign-offs for your team',
  ACCOUNTS: 'final sign-offs — approving applies the change',
};

export default async function ApprovalsPage() {
  const cookieHeader = await getCookieHeader();
  const me = await getMe({ cookieHeader });
  if (!(ALLOWED_ROLES as readonly string[]).includes(me.user.role)) {
    redirect('/');
  }

  const { items, total } = await getPendingApprovals({ cookieHeader });
  const hint = STAGE_HINT[me.user.role] ?? 'awaiting your decision';

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl flex flex-col gap-6">
      <PageHeader
        title="Approvals"
        subtitle={
          total === 0
            ? `No commercial changes awaiting ${hint}.`
            : `${total} ${total === 1 ? 'change' : 'changes'} · ${hint}`
        }
      />
      <ApprovalsList items={items} />
    </div>
  );
}
