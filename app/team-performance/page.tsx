import Link from 'next/link';
import {
  Users,
  Wallet,
  ClipboardList,
  CalendarClock,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { getMe } from '../../services/auth';
import { getTeamPerformance } from '../../services/team-performance';
import { PageHeader, SectionHeading } from '../../components/page-header';
import { StatCard } from '../../components/stat-card';
import { ArcPerSamChart, ChangesPerSamChart } from '../../components/team-charts';
import { ChurnPill } from '../../components/churn-pill';
import { DeltaTrend } from '../../components/delta-trend';
import { formatRupeesCompact } from '../../lib/format-rupees';

export default async function TeamPerformancePage() {
  const cookieHeader = await getCookieHeader();
  const me = await getMe({ cookieHeader });
  if (me.user.role !== 'SAM_HEAD' && me.user.role !== 'ADMIN') {
    redirect('/');
  }

  const data = await getTeamPerformance({ cookieHeader });
  const { team, sams } = data;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl flex flex-col gap-6">
      <PageHeader
        title="Team Performance"
        subtitle={
          team.samCount === 0
            ? 'No SAMs report to you yet.'
            : `${team.samCount} ${team.samCount === 1 ? 'SAM' : 'SAMs'} · ${team.customerCount} customers · ${formatRupeesCompact(team.totalArc)} ARC`
        }
      />

      {/* Headline stat cards */}
      <section>
        <SectionHeading>Team headline</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Customers"
            value={team.customerCount.toString()}
            subtitle={
              team.unassignedCount > 0
                ? `+ ${team.unassignedCount} unassigned`
                : 'All assigned'
            }
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            href="/customers"
          />
          <StatCard
            title="ARC managed"
            value={formatRupeesCompact(team.totalArc)}
            subtitle={
              team.startOfPeriodArc > 0 ? (
                <DeltaTrend value={team.arcDelta}>
                  <span>{formatRupeesCompact(team.arcDelta, { signed: true })}</span>
                  <span className="text-gray-500">since start</span>
                </DeltaTrend>
              ) : (
                'No baseline yet'
              )
            }
            icon={
              team.startOfPeriodArc === 0
                ? Wallet
                : team.arcDelta > 0
                  ? TrendingUp
                  : team.arcDelta < 0
                    ? TrendingDown
                    : Minus
            }
            iconBg={
              team.startOfPeriodArc === 0
                ? 'bg-orange-50'
                : team.arcDelta > 0
                  ? 'bg-emerald-50'
                  : team.arcDelta < 0
                    ? 'bg-red-50'
                    : 'bg-gray-50'
            }
            iconColor={
              team.startOfPeriodArc === 0
                ? 'text-brand-600'
                : team.arcDelta > 0
                  ? 'text-emerald-600'
                  : team.arcDelta < 0
                    ? 'text-red-600'
                    : 'text-gray-400'
            }
          />
          <StatCard
            title="Commercial changes"
            value={team.totalChanges.toString()}
            subtitle={
              team.activationPending > 0
                ? `${team.activationPending} pending activation`
                : 'No pending'
            }
            icon={ClipboardList}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            href="/transactions"
          />
          <StatCard
            title="Meetings & MOM"
            value={`${team.meetingsHeld} / ${team.momsSent}`}
            subtitle={
              team.momsPending > 0
                ? `${team.momsPending} MOM${team.momsPending === 1 ? '' : 's'} pending · held / sent`
                : `${team.meetingsHeld === 0 ? 'No meetings held yet' : 'Held / MOMs sent'}`
            }
            icon={CalendarClock}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            href="/meetings"
          />
        </div>
      </section>

      {/* Team-level churn vs allowable — the incentive headline. */}
      {sams.length > 0 && (
        <section>
          <SectionHeading>Allowable churn</SectionHeading>
          <div className="bg-white rounded-xl ring-1 ring-gray-200 px-5 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <ChurnPill
                actualPercent={team.netChurnPercent}
                allowablePercent={team.allowableChurnPercent}
                noBook={team.startOfPeriodArc === 0}
                size="md"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  Net churn vs allowable (ARC-weighted across the team)
                </p>
                <p className="text-xs text-gray-500">
                  Net churn = disconnections + downgrades − upgrades, denominated in start-of-period ARC.
                </p>
              </div>
            </div>
            <div className="sm:ml-auto flex items-center gap-4 text-sm tabular-nums">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Headroom</span>
                <span
                  className={`font-semibold ${
                    team.churnHeadroomPercent < 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  {team.churnHeadroomPercent >= 0 ? '+' : ''}
                  {team.churnHeadroomPercent.toFixed(2)}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">SAMs over budget</span>
                <span
                  className={`font-semibold ${
                    team.samsOverBudget > 0 ? 'text-red-600' : 'text-gray-900'
                  }`}
                >
                  {team.samsOverBudget} / {team.samCount}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Charts */}
      {sams.length > 0 && (
        <section>
          <SectionHeading>By SAM</SectionHeading>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ArcPerSamChart sams={sams} />
            <ChangesPerSamChart sams={sams} />
          </div>
        </section>
      )}

      {/* Per-SAM detailed table */}
      <section>
        <SectionHeading>Per-SAM breakdown</SectionHeading>
        {sams.length === 0 ? (
          <div className="bg-white rounded-xl ring-1 ring-gray-200 p-8 text-center">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">No SAMs report to you yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Go to <Link href="/users" className="text-brand-600 hover:underline">Users</Link> to add SAMs and assign them under you.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1000px]">
                <thead className="bg-gray-50/60 border-b border-gray-100">
                  <tr>
                    <Th>SAM</Th>
                    <Th align="center">Score</Th>
                    <Th align="right">Customers</Th>
                    <Th align="right">ARC</Th>
                    <Th align="center">Churn vs allowed</Th>
                    <Th align="center">Changes</Th>
                    <Th align="center">Meetings</Th>
                    <Th align="center">MOM SLA</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sams.map((s) => (
                    <SamTableRow key={s.userId} sam={s} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function SamTableRow({ sam }: { sam: import('../../services/team-performance').SamRow }) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={sam.name} />
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{sam.name}</div>
            <div className="text-xs text-gray-500 truncate">{sam.email}</div>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-center">
        <ScorePill score={sam.reliabilityScore} />
      </td>
      <td className="px-5 py-4 text-right tabular-nums text-gray-900">
        {sam.customerCount}
      </td>
      <td className="px-5 py-4 text-right tabular-nums font-medium text-gray-900">
        {formatRupeesCompact(sam.totalArc)}
      </td>
      <td className="px-5 py-4 text-center">
        <ChurnPill
          actualPercent={sam.netChurnPercent}
          allowablePercent={sam.allowableChurnPercent}
          noBook={sam.startOfPeriodArc === 0}
        />
      </td>
      <td className="px-5 py-4 text-center">
        <ChangesCell sam={sam} />
      </td>
      <td className="px-5 py-4 text-center">
        <MeetingsCell sam={sam} />
      </td>
      <td className="px-5 py-4 text-center">
        <PercentPill value={sam.momSlaPercent} good={70} ok={50} />
      </td>
      <td className="px-5 py-4 text-right">
        <Link
          href={`/team-performance/${sam.userId}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          View
          <ArrowRight className="w-3 h-3" />
        </Link>
      </td>
    </tr>
  );
}

function MeetingsCell({ sam }: { sam: import('../../services/team-performance').SamRow }) {
  const momsPending = Math.max(0, sam.meetingsHeld - sam.momsSent);
  const noMeeting = sam.customersWithoutMeeting;

  if (sam.meetingsHeld === 0 && noMeeting === 0) {
    return <span className="text-xs text-gray-300">No meetings</span>;
  }

  const chips: { count: number; label: string; classes: string }[] = [
    {
      count: sam.meetingsHeld,
      label: 'Held',
      classes: 'bg-blue-50 text-blue-700 ring-blue-100',
    },
    {
      count: momsPending,
      label: 'MOM pending',
      classes: 'bg-amber-50 text-amber-700 ring-amber-100',
    },
    {
      count: noMeeting,
      label: 'No mtg',
      classes: 'bg-red-50 text-red-700 ring-red-100',
    },
  ].filter((c) => c.count > 0);

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap justify-center">
      {chips.map((c) => (
        <span
          key={c.label}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ring-1 tabular-nums ${c.classes}`}
        >
          <span>{c.count}</span>
          <span className="text-[10px] uppercase tracking-wider opacity-70">{c.label}</span>
        </span>
      ))}
    </div>
  );
}

function ChangesCell({ sam }: { sam: import('../../services/team-performance').SamRow }) {
  if (sam.totalChanges === 0) {
    return <span className="text-xs text-gray-300">No changes</span>;
  }
  const chips: { count: number; label: string; classes: string }[] = [
    {
      count: sam.changes.UPGRADE.count,
      label: 'Up',
      classes: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    },
    {
      count: sam.changes.DOWNGRADE.count,
      label: 'Down',
      classes: 'bg-amber-50 text-amber-700 ring-amber-100',
    },
    {
      count: sam.changes.RATE_REVISION.count,
      label: 'Rate',
      classes: 'bg-violet-50 text-violet-700 ring-violet-100',
    },
    {
      count: sam.changes.DISCONNECTION.count,
      label: 'Disc',
      classes: 'bg-red-50 text-red-700 ring-red-100',
    },
  ].filter((c) => c.count > 0);

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap justify-center">
      {chips.map((c) => (
        <span
          key={c.label}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ring-1 tabular-nums ${c.classes}`}
        >
          <span>{c.count}</span>
          <span className="text-[10px] uppercase tracking-wider opacity-70">{c.label}</span>
        </span>
      ))}
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

function ScorePill({ score }: { score: number }) {
  const tone =
    score >= 80
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
      : score >= 60
        ? 'bg-amber-50 text-amber-700 ring-amber-100'
        : 'bg-red-50 text-red-700 ring-red-100';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 tabular-nums ${tone}`}
    >
      <ShieldCheck className="w-3 h-3" />
      {score.toFixed(0)}
    </span>
  );
}

function PercentPill({ value, good, ok }: { value: number; good: number; ok: number }) {
  const tone =
    value >= good
      ? 'text-emerald-600'
      : value >= ok
        ? 'text-amber-600'
        : 'text-red-600';
  return (
    <span className={`text-sm font-medium tabular-nums ${tone}`}>
      {value.toFixed(0)}%
    </span>
  );
}

const AVATAR_COLORS = [
  'from-rose-500 to-rose-600',
  'from-orange-500 to-orange-600',
  'from-amber-500 to-amber-600',
  'from-emerald-500 to-emerald-600',
  'from-cyan-500 to-cyan-600',
  'from-blue-500 to-blue-600',
  'from-indigo-500 to-indigo-600',
  'from-purple-500 to-purple-600',
];

function Avatar({ name }: { name: string }) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const gradient = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length === 1
      ? parts[0]!.slice(0, 2).toUpperCase()
      : (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  return (
    <div
      className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} text-white font-semibold flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow-sm text-xs`}
    >
      {initials}
    </div>
  );
}
