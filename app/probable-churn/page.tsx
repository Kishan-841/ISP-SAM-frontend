import Link from 'next/link';
import { ShieldAlert, Wallet, Clock3, ListChecks, Sparkles, BarChart3 } from 'lucide-react';
import { PageHeader, SectionHeading } from '../../components/page-header';
import { StatCard } from '../../components/stat-card';
import { ProbableChurnTable } from '../../components/probable-churn-table';
import { QuickPendingTable } from '../../components/quick-pending-table';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { getProbableChurn } from '../../services/probable-churn';
import { formatRupeesCompact } from '../../lib/format-rupees';

type KittyFilter = 'BASE' | 'NEW' | undefined;

const TAB_CHIPS = [
  {
    key: 'ALL' as const,
    label: 'All',
    icon: ListChecks,
    active: { bg: 'bg-gray-900', text: 'text-white', ring: 'ring-gray-900' },
  },
  {
    key: 'NEW' as const,
    label: 'New Base',
    icon: Sparkles,
    active: { bg: 'bg-emerald-600', text: 'text-white', ring: 'ring-emerald-600' },
  },
  {
    key: 'BASE' as const,
    label: 'Existing Base',
    icon: BarChart3,
    active: { bg: 'bg-brand-600', text: 'text-white', ring: 'ring-brand-600' },
  },
];

export default async function ProbableChurnPage({
  searchParams,
}: {
  searchParams: Promise<{ kitty?: string }>;
}) {
  const sp = await searchParams;
  const kitty: KittyFilter = sp.kitty === 'BASE' || sp.kitty === 'NEW' ? sp.kitty : undefined;

  const cookieHeader = await getCookieHeader();
  const data = await getProbableChurn({ cookieHeader });

  // Tab counts come from the full row set so users can see what's in each
  // bucket before clicking. Filtering happens client-side after.
  const counts = {
    ALL: data.rows.length,
    NEW: data.rows.filter((r) => r.account.kittyType === 'NEW').length,
    BASE: data.rows.filter((r) => r.account.kittyType === 'BASE').length,
  };

  const filteredRows = kitty ? data.rows.filter((r) => r.account.kittyType === kitty) : data.rows;
  // Split quick-approval-pending rows out so they get their own section above
  // the 21-day retention queue — they're a different mental model (awaiting
  // CRM admin sign-off, not awaiting day-21 prompt).
  const quickPendingRows = filteredRows.filter(
    (r) => r.account.contractStatus === 'PENDING_QUICK_APPROVAL',
  );
  const retentionRows = filteredRows.filter(
    (r) => r.account.contractStatus !== 'PENDING_QUICK_APPROVAL',
  );
  const filteredAtRiskArc = filteredRows.reduce((s, r) => s + r.account.currentArc, 0);
  const pendingPrompt = retentionRows.filter((r) => r.retentionDecision === null).length;
  const inDisconnecting = retentionRows.filter((r) => r.retentionDecision === 'PROCEED').length;

  const scopeLabel =
    kitty === 'NEW' ? 'New Base customers' : kitty === 'BASE' ? 'Existing Base customers' : null;

  return (
    <div className="px-8 py-6 max-w-7xl flex flex-col gap-6">
      <PageHeader
        title="Probable Churn"
        subtitle={
          scopeLabel
            ? `${scopeLabel} · 21-day retention window / 10-day notice period`
            : 'Customers in the 21-day retention window or 10-day notice period. The retention queue.'
        }
      />

      {/* Kitty tabs — All / New Base / Existing Base. Existing Base hides the
          CRM Hand-off column since those customers aren't synced from CRM. */}
      <div className="flex flex-wrap items-center gap-2">
        {TAB_CHIPS.map((chip) => {
          const Icon = chip.icon;
          const isActive = chip.key === 'ALL' ? !kitty : chip.key === kitty;
          const href = chip.key === 'ALL' ? '/probable-churn' : `/probable-churn?kitty=${chip.key}`;
          const count = counts[chip.key];
          return (
            <Link
              key={chip.key}
              href={href}
              className={
                isActive
                  ? `inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-[background-color,color,box-shadow,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.97] shadow-sm ring-1 ${chip.active.bg} ${chip.active.text} ${chip.active.ring}`
                  : 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-700 transition-[background-color,border-color,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.97] hoverable:hover:bg-gray-50 hoverable:hover:border-gray-300'
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {chip.label}
              <span
                className={
                  isActive
                    ? 'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-mono bg-white/20 text-white'
                    : 'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-mono bg-gray-100 text-gray-600'
                }
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="card-stagger grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title={`At Risk Customers (${filteredRows.length})`}
          value={filteredRows.length.toString()}
          subtitle="In probable-churn or disconnecting state"
          icon={ShieldAlert}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          valueColor="text-amber-700"
        />
        <StatCard
          title="At Risk ARC"
          value={formatRupeesCompact(filteredAtRiskArc)}
          subtitle="Revenue currently excluded from Current ARC"
          icon={Wallet}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          valueColor="text-rose-700"
        />
        <StatCard
          title="Awaiting Day-21 Prompt"
          value={pendingPrompt.toString()}
          subtitle={`${inDisconnecting} already proceeding with disconnection`}
          icon={Clock3}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
      </div>

      {quickPendingRows.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeading>
            Awaiting CRM Admin Approval ({quickPendingRows.length})
          </SectionHeading>
          <p className="text-xs text-gray-500 -mt-1">
            Quick disconnect requests — 21-day retention skipped. CRM Admin must approve before
            the customer is moved to DISCONNECTING.
          </p>
          <QuickPendingTable rows={quickPendingRows} />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <SectionHeading>Retention Queue</SectionHeading>
        {retentionRows.length === 0 ? (
          <div className="rounded-lg border border-gray-100 bg-white p-12 text-center">
            <ShieldAlert className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-700">
              {kitty
                ? `No ${kitty === 'BASE' ? 'Existing Base' : 'New Base'} customers in the retention queue`
                : 'No customers in the retention queue right now'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Disconnection requests appear here for the 21-day retention window. Raise one from{' '}
              <Link href="/commercial-change" className="text-brand-600 hover:underline">
                Commercial Change
              </Link>
              .
            </p>
          </div>
        ) : (
          <ProbableChurnTable rows={retentionRows} kittyFilter={kitty} />
        )}
      </section>
    </div>
  );
}
