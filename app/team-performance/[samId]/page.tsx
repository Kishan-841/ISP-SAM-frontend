import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Wallet,
  ClipboardList,
  CalendarClock,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { getCookieHeader } from '../../../lib/get-cookie-header';
import { getMe } from '../../../services/auth';
import { getTeamPerformance } from '../../../services/team-performance';
import { getAccounts } from '../../../services/accounts';
import { getCommercialChanges } from '../../../services/commercial-changes';
import { PageHeader, SectionHeading } from '../../../components/page-header';
import { StatCard } from '../../../components/stat-card';
import { CustomersTable } from '../../../components/customers-table';
import { TransactionsTable } from '../../../components/transactions-table';
import { formatRupeesCompact } from '../../../lib/format-rupees';

export default async function SamDetailPage({
  params,
}: {
  params: Promise<{ samId: string }>;
}) {
  const { samId } = await params;
  const cookieHeader = await getCookieHeader();

  const me = await getMe({ cookieHeader });
  if (me.user.role !== 'SAM_HEAD' && me.user.role !== 'ADMIN') {
    redirect('/');
  }

  // The team-performance endpoint already validates "is this SAM in your team",
  // so we use the row from there as both an authz gate and the data source.
  const team = await getTeamPerformance({ cookieHeader });
  const sam = team.sams.find((s) => s.userId === samId);
  if (!sam) notFound();

  // Pull this SAM's customers and transactions in parallel for the bottom panels.
  // We fetch the full set as the SAM_HEAD then filter client-side — the volume
  // is small (one SAM's customers) and avoids adding a server-side filter.
  const [accountsRes, changesRes] = await Promise.all([
    getAccounts({}, { cookieHeader }),
    getCommercialChanges({}, { cookieHeader }),
  ]);
  const samAccounts = accountsRes.accounts.filter((a) => a.samOwnerId === samId);
  const samChanges = changesRes.changes.filter((c) => {
    // Find the owning account so we can match samOwnerId; fall back to the
    // Set of accounts above for accounts the SAM has lost ownership of since.
    const owned = samAccounts.find((a) => a.id === c.accountId);
    return !!owned;
  });

  return (
    <div className="px-8 py-6 max-w-7xl flex flex-col gap-6">
      {/* Back link */}
      <Link
        href="/team-performance"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 -mb-2 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to team
      </Link>

      <PageHeader
        title={sam.name}
        subtitle={sam.email}
        right={<ScorePill score={sam.reliabilityScore} />}
      />

      {/* Headline cards */}
      <section>
        <SectionHeading>Headline</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Customers"
            value={sam.customerCount.toString()}
            subtitle={
              sam.customersWithoutMeeting > 0
                ? `${sam.customersWithoutMeeting} without any meeting`
                : 'All have at least 1 meeting'
            }
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            title="ARC managed"
            value={formatRupeesCompact(sam.totalArc)}
            subtitle={
              sam.startOfPeriodArc > 0
                ? `Δ ${formatRupeesCompact(sam.arcDelta, { signed: true })} (${sam.arcDeltaPercent > 0 ? '+' : ''}${sam.arcDeltaPercent.toFixed(1)}%)`
                : 'No baseline'
            }
            icon={Wallet}
            iconBg="bg-orange-50"
            iconColor="text-brand-600"
            valueColor={
              sam.arcDelta > 0
                ? 'text-emerald-600'
                : sam.arcDelta < 0
                  ? 'text-red-600'
                  : undefined
            }
          />
          <StatCard
            title="Commercial changes"
            value={sam.totalChanges.toString()}
            subtitle={
              sam.activationPending > 0
                ? `${sam.activationPending} pending activation`
                : 'No pending'
            }
            icon={ClipboardList}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
          <StatCard
            title="Meetings held"
            value={sam.meetingsHeld.toString()}
            subtitle={`${sam.momsSent} MOMs sent · ${sam.momSlaPercent.toFixed(0)}% within 48h`}
            icon={CalendarClock}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
        </div>
      </section>

      {/* Change-type breakdown */}
      <section>
        <SectionHeading>Commercial change breakdown</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ChangeBucket
            label="Upgrades"
            count={sam.changes.UPGRADE.count}
            arc={sam.changes.UPGRADE.arcImpact}
            tone="emerald"
            arcLabel="ARC added"
          />
          <ChangeBucket
            label="Downgrades"
            count={sam.changes.DOWNGRADE.count}
            arc={sam.changes.DOWNGRADE.arcImpact}
            tone="amber"
            arcLabel="ARC reduced"
          />
          <ChangeBucket
            label="Rate revisions"
            count={sam.changes.RATE_REVISION.count}
            arc={sam.changes.RATE_REVISION.arcImpact}
            tone="violet"
            arcLabel="ARC change"
          />
          <ChangeBucket
            label="Disconnections"
            count={sam.changes.DISCONNECTION.count}
            arc={sam.changes.DISCONNECTION.arcImpact}
            tone="red"
            arcLabel="ARC lost"
          />
        </div>
      </section>

      {/* Customers */}
      <section>
        <SectionHeading>Customers ({samAccounts.length})</SectionHeading>
        <CustomersTable accounts={samAccounts} currentUser={me.user} />
      </section>

      {/* Transactions */}
      <section>
        <SectionHeading>Recent commercial changes ({samChanges.length})</SectionHeading>
        <TransactionsTable changes={samChanges} />
      </section>
    </div>
  );
}

function ChangeBucket({
  label,
  count,
  arc,
  tone,
  arcLabel,
}: {
  label: string;
  count: number;
  arc: number;
  tone: 'emerald' | 'amber' | 'violet' | 'red';
  arcLabel: string;
}) {
  const tones = {
    emerald: { ring: 'ring-emerald-100', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: TrendingUp },
    amber: { ring: 'ring-amber-100', bg: 'bg-amber-50', text: 'text-amber-700', icon: TrendingDown },
    violet: { ring: 'ring-violet-100', bg: 'bg-violet-50', text: 'text-violet-700', icon: ClipboardList },
    red: { ring: 'ring-red-100', bg: 'bg-red-50', text: 'text-red-700', icon: AlertCircle },
  } as const;
  const t = tones[tone];
  const Icon = t.icon;
  return (
    <div className={`bg-white rounded-xl ring-1 ${t.ring} p-5 flex flex-col gap-2`}>
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg ${t.bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${t.text}`} />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900 tabular-nums">{count}</div>
      <div className="text-xs text-gray-500">
        {arc > 0 ? formatRupeesCompact(arc) : '₹0'} <span className="text-gray-400">· {arcLabel}</span>
      </div>
    </div>
  );
}

function ScorePill({ score }: { score: number }) {
  const tone =
    score >= 80
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
      : score >= 60
        ? 'bg-amber-50 text-amber-700 ring-amber-100'
        : 'bg-red-50 text-red-700 ring-red-100';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ring-1 tabular-nums ${tone}`}
    >
      <ShieldCheck className="w-4 h-4" />
      {score.toFixed(0)}
      <span className="text-[10px] font-normal uppercase tracking-wider opacity-60">Score</span>
    </span>
  );
}
