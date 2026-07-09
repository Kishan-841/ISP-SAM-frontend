import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import { getMe } from '../../services/auth';
import { getApprovals, type ApprovalTab } from '../../services/commercial-changes';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { PageHeader } from '../../components/page-header';
import { ApprovalsList } from '../../components/approvals-list';
import { ApprovalsHistoryTable } from '../../components/approvals-history-table';

/**
 * Internal approvals for BASE (existing-base) commercial changes.
 *
 *   Pending  → the viewer's per-stage queue (with Approve / Reject)
 *   Approved → history of fully-approved changes (who + when)
 *   Rejected → history of rejected changes (who + when + reason)
 *
 * NEW-base changes never appear here — they route straight to CRM.
 */
export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['ADMIN', 'SUPER_ADMIN_2', 'SAM_HEAD', 'ACCOUNTS'] as const;

const TABS: { key: ApprovalTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'approved', label: 'Approved', icon: CheckCircle2 },
  { key: 'rejected', label: 'Rejected', icon: XCircle },
];

const STAGE_HINT: Record<string, string> = {
  ADMIN: 'every pending stage across all SAMs',
  SUPER_ADMIN_2: 'first-stage disconnection sign-offs',
  SAM_HEAD: 'quick-disconnect sign-offs for your team',
  ACCOUNTS: 'final sign-offs — approving applies the change',
};

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const cookieHeader = await getCookieHeader();
  const me = await getMe({ cookieHeader });
  if (!(ALLOWED_ROLES as readonly string[]).includes(me.user.role)) {
    redirect('/');
  }

  const sp = await searchParams;
  const tab: ApprovalTab =
    sp.status === 'approved' || sp.status === 'rejected' ? sp.status : 'pending';

  const { items, total, counts } = await getApprovals(tab, { cookieHeader });

  const subtitle =
    tab === 'pending'
      ? total === 0
        ? `No commercial changes awaiting ${STAGE_HINT[me.user.role] ?? 'your decision'}.`
        : `${total} ${total === 1 ? 'change' : 'changes'} · ${STAGE_HINT[me.user.role] ?? 'awaiting your decision'}`
      : tab === 'approved'
        ? `${total} approved commercial ${total === 1 ? 'change' : 'changes'}`
        : `${total} rejected commercial ${total === 1 ? 'change' : 'changes'}`;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl flex flex-col gap-4">
      <PageHeader title="Approvals" subtitle={subtitle} />

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = t.key === tab;
          const count = counts[t.key];
          const href = t.key === 'pending' ? '/approvals' : `/approvals?status=${t.key}`;
          return (
            <Link
              key={t.key}
              href={href}
              className={
                active
                  ? 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gray-900 text-white ring-1 ring-gray-900 transition-all shadow-sm'
                  : 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all'
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              <span
                className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${
                  active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {tab === 'pending' ? (
        <ApprovalsList items={items} />
      ) : (
        <ApprovalsHistoryTable items={items} tab={tab} />
      )}
    </div>
  );
}
