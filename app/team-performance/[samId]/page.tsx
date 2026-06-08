import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Wallet,
  ClipboardList,
  CalendarClock,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  XCircle,
  CalendarX,
  CalendarDays,
  FileCheck2,
  UserCheck,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { getCookieHeader } from '../../../lib/get-cookie-header';
import { getMe } from '../../../services/auth';
import { getSamDetail, type FyQuarter, type SamDetail } from '../../../services/sam-detail';
import { getAccounts } from '../../../services/accounts';
import { getCommercialChanges } from '../../../services/commercial-changes';
import { PageHeader } from '../../../components/page-header';
import { QuarterFilter } from '../../../components/quarter-filter';
import { CustomersTable } from '../../../components/customers-table';
import { TransactionsTable } from '../../../components/transactions-table';
import { ChurnPill } from '../../../components/churn-pill';
import { formatRupees, formatRupeesCompact } from '../../../lib/format-rupees';

const QUARTERS: ReadonlySet<string> = new Set(['Q1', 'Q2', 'Q3', 'Q4']);

export default async function SamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ samId: string }>;
  searchParams: Promise<{ quarter?: string }>;
}) {
  const { samId } = await params;
  const sp = await searchParams;
  const quarter = QUARTERS.has(sp.quarter ?? '') ? (sp.quarter as FyQuarter) : undefined;
  const cookieHeader = await getCookieHeader();

  const me = await getMe({ cookieHeader });
  if (me.user.role !== 'SAM_HEAD' && me.user.role !== 'ADMIN') {
    redirect('/');
  }

  let data: SamDetail;
  try {
    data = await getSamDetail(samId, { quarter }, { cookieHeader });
  } catch {
    notFound();
  }

  // Existing tables (customers + transactions) need data the new endpoint
  // doesn't return — fetch them in parallel against the role-scoped APIs.
  const [accountsRes, changesRes] = await Promise.all([
    getAccounts({}, { cookieHeader }),
    getCommercialChanges({}, { cookieHeader }),
  ]);
  const samAccounts = accountsRes.accounts.filter((a) => a.samOwnerId === samId);
  const samChanges = changesRes.changes.filter((c) =>
    samAccounts.some((a) => a.id === c.accountId),
  );

  const scopeLabel = data.quarter ?? 'FYTD';

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl flex flex-col gap-6">
      {/* Back link + period filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 -mb-2">
        <Link
          href="/team-performance"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to team
        </Link>
        <QuarterFilter active={quarter} />
      </div>

      <PageHeader
        title={data.sam.name}
        subtitle={`${data.sam.email}${data.sam.samHeadName ? ` · reports to ${data.sam.samHeadName}` : ''} · ${scopeLabel}`}
      />

      <SamHero data={data} />

      <SamKpiRow data={data} />

      {/* Calendar + Risk pulse side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        <MeetingCalendar
          upcoming={data.upcomingMeetings}
          recent={data.recentMeetings}
        />
        <RiskPulse pulse={data.riskPulse} samName={data.sam.name.split(' ')[0] ?? data.sam.name} />
      </div>

      <ChangeBucketRow changes={data.changes} />

      <ChurnVsAllowed churn={data.churn} />

      <ActivityTimeline items={data.activityTimeline} />

      <section className="flex flex-col gap-3">
        <h2 className="border-l-4 border-brand-600 pl-3 text-base font-semibold text-gray-900">
          Customers ({samAccounts.length})
        </h2>
        <CustomersTable accounts={samAccounts} currentUser={me.user} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="border-l-4 border-brand-600 pl-3 text-base font-semibold text-gray-900">
          Recent commercial changes ({samChanges.length})
        </h2>
        <TransactionsTable changes={samChanges} />
      </section>
    </div>
  );
}

/*
 * Hero strip — single glance verdict. Big reliability score on the right
 * with a stacked bar of the four weighted components (Revenue / MOM /
 * Compliance / Onboarding). The four `weighted` figures sum to `total`,
 * so the bar literally is the score.
 */
function SamHero({ data }: { data: SamDetail }) {
  const s = data.score;
  const initials = data.sam.name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const tone =
    s.total >= 80
      ? { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
      : s.total >= 60
        ? { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' }
        : { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
  const segments = [
    { label: 'Revenue', value: s.components.revenue.weighted, color: 'bg-brand-500', weight: 40 },
    { label: 'MOM', value: s.components.mom.weighted, color: 'bg-amber-500', weight: 20 },
    { label: 'Compliance', value: s.components.compliance.weighted, color: 'bg-emerald-500', weight: 25 },
    { label: 'Onboarding', value: s.components.onboarding.weighted, color: 'bg-indigo-500', weight: 15 },
  ];
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 sm:p-6 flex flex-col md:flex-row items-stretch gap-4 sm:gap-6">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-100 to-amber-100 grid place-items-center text-brand-700 font-bold text-lg shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex flex-col">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">SAM Profile</p>
          <p className="text-lg font-semibold text-gray-900 truncate">{data.sam.name}</p>
          <p className="text-xs text-gray-500 truncate">
            {data.kpis.customers.value} customers · {formatRupeesCompact(data.kpis.arcManaged.value)} ARC managed
          </p>
        </div>
      </div>
      <div className="w-full md:w-[42ch] flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Reliability Score</span>
          <div className="flex items-baseline gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ring-1 ${tone.bg} ${tone.text} ${tone.border}`}
            >
              <ShieldCheck className="w-3 h-3 mr-1" />
              {s.total >= 80 ? 'Strong' : s.total >= 60 ? 'Watch' : 'Concern'}
            </span>
            <span className="text-3xl font-bold tabular-nums text-gray-900">{s.total.toFixed(0)}</span>
            <span className="text-xs text-gray-500">/ 100</span>
          </div>
        </div>
        {/* Stacked component bar — the four `weighted` numbers sum to total */}
        <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden flex">
          {segments.map((seg) => (
            <div
              key={seg.label}
              className={seg.color}
              style={{ width: `${(seg.value / 100) * 100}%` }}
              title={`${seg.label}: ${seg.value.toFixed(1)} of ${seg.weight}`}
            />
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {segments.map((seg) => (
            <li key={seg.label} className="flex items-baseline justify-between gap-2">
              <span className="flex items-center gap-1.5 text-gray-700">
                <span className={`w-2 h-2 rounded-full ${seg.color}`} />
                {seg.label}
              </span>
              <span className="tabular-nums text-gray-500">
                {seg.value.toFixed(1)}
                <span className="text-gray-400"> / {seg.weight}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/*
 * KPI row — five glanceable cards. Each one shows the SAM's number + a
 * comparator against the peer-group average (same samHeadId).
 */
function SamKpiRow({ data }: { data: SamDetail }) {
  const k = data.kpis;
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      <KpiCard
        icon={Users}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
        label="Customers"
        value={k.customers.value.toLocaleString('en-IN')}
        teamAvg={k.customers.teamAvg}
        teamAvgFormat={(n) => n.toFixed(1)}
        delta={k.customers.value - k.customers.teamAvg}
        sub={
          k.customers.withoutMeeting > 0
            ? `${k.customers.withoutMeeting} without any meeting`
            : 'All have at least 1 meeting'
        }
      />
      <KpiCard
        icon={Wallet}
        iconBg="bg-orange-50"
        iconColor="text-brand-600"
        label="ARC managed"
        value={formatRupeesCompact(k.arcManaged.value)}
        teamAvg={k.arcManaged.teamAvg}
        teamAvgFormat={(n) => formatRupeesCompact(n)}
        delta={k.arcManaged.value - k.arcManaged.teamAvg}
        sub={
          k.arcManaged.arcDelta !== 0
            ? `Δ ${formatRupeesCompact(k.arcManaged.arcDelta, { signed: true })} (${k.arcManaged.arcDeltaPercent > 0 ? '+' : ''}${k.arcManaged.arcDeltaPercent.toFixed(1)}%)`
            : 'No change vs start'
        }
        valueColor={
          k.arcManaged.arcDelta > 0
            ? 'text-emerald-600'
            : k.arcManaged.arcDelta < 0
              ? 'text-red-600'
              : undefined
        }
      />
      <KpiCard
        icon={ClipboardList}
        iconBg="bg-purple-50"
        iconColor="text-purple-600"
        label="Commercial changes"
        value={k.commercialChanges.value.toString()}
        teamAvg={k.commercialChanges.teamAvg}
        teamAvgFormat={(n) => n.toFixed(1)}
        delta={k.commercialChanges.value - k.commercialChanges.teamAvg}
        sub={
          k.commercialChanges.activationPending > 0
            ? `${k.commercialChanges.activationPending} pending activation`
            : 'No pending activations'
        }
      />
      <KpiCard
        icon={CalendarClock}
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        label="Meetings held"
        value={k.meetings.value.toString()}
        teamAvg={k.meetings.teamAvg}
        teamAvgFormat={(n) => n.toFixed(1)}
        delta={k.meetings.value - k.meetings.teamAvg}
        sub={`${k.meetings.upcomingCount} upcoming this week`}
      />
      <KpiCard
        icon={Mail}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
        label="MOM SLA"
        value={`${k.momSla.value.toFixed(0)}%`}
        teamAvg={k.momSla.teamAvg}
        teamAvgFormat={(n) => `${n.toFixed(0)}%`}
        delta={k.momSla.value - k.momSla.teamAvg}
        sub={
          k.momSla.momsOverdue > 0
            ? `${k.momSla.momsOverdue} MOM${k.momSla.momsOverdue === 1 ? '' : 's'} overdue`
            : 'All MOMs within SLA'
        }
        valueColor={
          k.momSla.value >= 80
            ? 'text-emerald-700'
            : k.momSla.value >= 60
              ? 'text-amber-700'
              : 'text-red-700'
        }
      />
    </section>
  );
}

function KpiCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  valueColor,
  teamAvg,
  teamAvgFormat,
  delta,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  valueColor?: string;
  teamAvg: number;
  teamAvgFormat: (n: number) => string;
  delta: number;
  sub: string;
}) {
  const deltaColor =
    delta > 0
      ? 'text-emerald-600'
      : delta < 0
        ? 'text-red-600'
        : 'text-gray-400';
  const deltaIcon = delta > 0 ? '▲' : delta < 0 ? '▼' : '·';
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.16em] text-gray-500">{label}</span>
        <div className={`w-7 h-7 rounded-md grid place-items-center ${iconBg} ${iconColor}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <p className={`text-2xl font-bold tabular-nums ${valueColor ?? 'text-gray-900'}`}>
        {value}
      </p>
      <div className="flex items-center gap-1.5 text-[11px] tabular-nums">
        <span className="text-gray-400">Team avg {teamAvgFormat(teamAvg)}</span>
        {Number.isFinite(delta) && (
          <span className={deltaColor}>
            {deltaIcon} {teamAvgFormat(Math.abs(delta))}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
    </div>
  );
}

/*
 * Meeting calendar — vertical list, two sections (Next 7d / Last 7d),
 * grouped by ISO date. MOM status badge on each held meeting.
 */
function MeetingCalendar({
  upcoming,
  recent,
}: {
  upcoming: SamDetail['upcomingMeetings'];
  recent: SamDetail['recentMeetings'];
}) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white flex flex-col">
      <header className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-gray-900">Meeting calendar</h3>
        </div>
        <Link
          href="/meetings"
          className="text-xs text-gray-500 hover:text-brand-600 inline-flex items-center gap-0.5"
        >
          All meetings <ChevronRight className="w-3 h-3" />
        </Link>
      </header>
      <div className="flex flex-col divide-y divide-gray-100">
        <CalendarBlock
          title="Next 7 days"
          empty="No meetings scheduled this week."
          items={groupByDay(
            upcoming.map((m) => ({
              id: m.id,
              when: m.scheduledAt,
              customer: m.customer,
              status: 'scheduled' as const,
            })),
          )}
        />
        <CalendarBlock
          title="Last 7 days"
          empty="No meetings held this week."
          items={groupByDay(
            recent.map((m) => ({
              id: m.id,
              when: m.heldAt ?? m.scheduledAt,
              customer: m.customer,
              status: m.momSentAt
                ? ('mom-sent' as const)
                : m.momOverdue
                  ? ('mom-overdue' as const)
                  : ('mom-pending' as const),
            })),
          )}
        />
      </div>
    </section>
  );
}

type MeetingDayItem = {
  id: string;
  when: string;
  customer: { id: string; clientName: string; companyName: string | null };
  status: 'scheduled' | 'mom-sent' | 'mom-pending' | 'mom-overdue';
};

function CalendarBlock({
  title,
  items,
  empty,
}: {
  title: string;
  items: Array<{ key: string; label: string; meetings: MeetingDayItem[] }>;
  empty: string;
}) {
  return (
    <div className="px-5 py-4 flex flex-col gap-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((day) => (
            <li key={day.key} className="flex gap-4">
              <div className="w-16 shrink-0 pt-0.5">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">{day.label.split(' ')[0]}</p>
                <p className="text-sm font-semibold text-gray-900 tabular-nums">
                  {day.label.split(' ').slice(1).join(' ')}
                </p>
              </div>
              <ul className="flex-1 flex flex-col gap-1.5">
                {day.meetings.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/meetings/${m.id}`}
                      className="flex items-center justify-between gap-3 rounded-md px-2.5 py-1.5 hoverable:hover:bg-gray-50 transition-colors duration-150"
                    >
                      <span className="flex items-baseline gap-2 min-w-0">
                        <span className="text-xs font-mono text-gray-500 tabular-nums shrink-0">
                          {timeOnly(m.when)}
                        </span>
                        <span className="text-sm text-gray-800 truncate">
                          {m.customer.companyName || m.customer.clientName}
                        </span>
                      </span>
                      <MomStatusBadge status={m.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MomStatusBadge({ status }: { status: MeetingDayItem['status'] }) {
  if (status === 'scheduled')
    return <span className="text-[10px] uppercase tracking-wider text-gray-400">Scheduled</span>;
  if (status === 'mom-sent')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-700">
        <FileCheck2 className="w-3 h-3" />
        MOM sent
      </span>
    );
  if (status === 'mom-overdue')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-red-700">
        <AlertTriangle className="w-3 h-3" />
        MOM overdue
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-700">
      MOM pending
    </span>
  );
}

/*
 * Risk pulse — narrow side panel with the urgent stuff. Three signals:
 * probable-churn count + at-risk ARC, customers w/o meetings, stale MOMs,
 * day-21 prompts overdue.
 */
function RiskPulse({
  pulse,
  samName,
}: {
  pulse: SamDetail['riskPulse'];
  samName: string;
}) {
  const items = [
    {
      label: 'In probable churn',
      value: pulse.probableChurnCount.toString(),
      sub:
        pulse.probableChurnArc > 0
          ? `${formatRupeesCompact(pulse.probableChurnArc)} at risk`
          : null,
      icon: AlertTriangle,
      tone: pulse.probableChurnCount > 0 ? 'amber' : 'gray',
      href: pulse.probableChurnCount > 0 ? '/probable-churn' : null,
    },
    {
      label: 'Day-21 prompts due',
      value: pulse.day21Prompts.toString(),
      sub: pulse.day21Prompts > 0 ? 'Need a retain/proceed call' : null,
      icon: CalendarX,
      tone: pulse.day21Prompts > 0 ? 'red' : 'gray',
      href: pulse.day21Prompts > 0 ? '/probable-churn' : null,
    },
    {
      label: 'Customers without meetings',
      value: pulse.customersWithoutMeeting.toString(),
      sub: pulse.customersWithoutMeeting > 0 ? `Schedule a kick-off` : null,
      icon: UserCheck,
      tone: pulse.customersWithoutMeeting > 0 ? 'amber' : 'gray',
      href: null,
    },
    {
      label: 'Stale MOMs',
      value: pulse.staleMoms.toString(),
      sub: pulse.staleMoms > 0 ? 'Meeting held > 48h with no MOM' : null,
      icon: AlertTriangle,
      tone: pulse.staleMoms > 0 ? 'red' : 'gray',
      href: null,
    },
  ];
  const toneClasses: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    red: 'bg-red-50 text-red-700 ring-red-100',
    gray: 'bg-gray-50 text-gray-500 ring-gray-100',
  };
  return (
    <section className="rounded-xl border border-gray-100 bg-white flex flex-col">
      <header className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-brand-600" />
        <h3 className="text-sm font-semibold text-gray-900">Risk pulse</h3>
        <span className="text-xs text-gray-400">— what {samName} needs to handle</span>
      </header>
      <ul className="divide-y divide-gray-100">
        {items.map((it) => {
          const Icon = it.icon;
          const numeric = parseInt(it.value, 10);
          const inner = (
            <div className="flex items-center gap-3 px-5 py-3.5">
              <div className={`w-8 h-8 rounded-md grid place-items-center ring-1 ${toneClasses[it.tone]}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600">{it.label}</p>
                {it.sub && <p className="text-[11px] text-gray-400 mt-0.5">{it.sub}</p>}
              </div>
              <span
                className={`text-xl font-bold tabular-nums ${numeric > 0 ? 'text-gray-900' : 'text-gray-300'}`}
              >
                {it.value}
              </span>
            </div>
          );
          return (
            <li key={it.label}>
              {it.href ? (
                <Link
                  href={it.href}
                  className="block hoverable:hover:bg-gray-50 transition-colors duration-150"
                >
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/*
 * Allowable-churn / incentive panel. Pulls the backend's `churn` block
 * directly — the math (disconnections + downgrades − upgrades, denominated
 * in start-of-period ARC) is the source of truth in
 * team-performance.service.ts; do NOT recompute it here.
 */
function ChurnVsAllowed({ churn }: { churn: SamDetail['churn'] }) {
  const over = churn.churnStatus === 'over_budget';
  return (
    <section className="rounded-xl border border-gray-100 bg-white flex flex-col">
      <header className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-brand-600" />
        <h3 className="text-sm font-semibold text-gray-900">Allowable churn</h3>
        <span className="text-xs text-gray-400">— incentive eligibility</span>
      </header>
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <ChurnPill
          actualPercent={churn.netChurnPercent}
          allowablePercent={churn.allowableChurnPercent}
          status={churn.churnStatus}
          size="md"
        />
        <div className="text-xs text-gray-500 sm:ml-2 min-w-0 flex-1">
          Net churn = disconnections + downgrades − upgrades = {formatRupees(churn.netChurnArc)}.
          {over
            ? ' Over the allowable ceiling — incentive is at risk until losses drop back inside the budget.'
            : ' Within the allowable ceiling — on track for incentive.'}
        </div>
        <div className="sm:ml-auto grid grid-cols-2 sm:flex sm:items-center gap-4 text-sm tabular-nums shrink-0">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Allowable</span>
            <span className="font-semibold text-gray-900">
              {churn.allowableChurnPercent.toFixed(2)}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Headroom</span>
            <span
              className={`font-semibold ${
                churn.churnHeadroomPercent < 0 ? 'text-red-600' : 'text-emerald-600'
              }`}
            >
              {churn.churnHeadroomPercent >= 0 ? '+' : ''}
              {churn.churnHeadroomPercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/*
 * Commercial change buckets — same 4-card row as before, repositioned
 * below the calendar/risk so the urgent stuff comes first.
 */
function ChangeBucketRow({ changes }: { changes: SamDetail['changes'] }) {
  const buckets = [
    { label: 'Upgrades', count: changes.UPGRADE.count, arc: changes.UPGRADE.arcImpact, tone: 'emerald' as const, sub: 'ARC added', icon: TrendingUp },
    { label: 'Downgrades', count: changes.DOWNGRADE.count, arc: changes.DOWNGRADE.arcImpact, tone: 'amber' as const, sub: 'ARC reduced', icon: TrendingDown },
    { label: 'Rate revisions', count: changes.RATE_REVISION.count, arc: changes.RATE_REVISION.arcImpact, tone: 'violet' as const, sub: 'Bandwidth uplift', icon: ArrowUpDown },
    { label: 'Disconnections', count: changes.DISCONNECTION.count, arc: changes.DISCONNECTION.arcImpact, tone: 'red' as const, sub: 'ARC lost', icon: XCircle },
  ];
  const tones = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-100' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-100' },
    red: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-100' },
  } as const;
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {buckets.map((b) => {
        const t = tones[b.tone];
        const Icon = b.icon;
        return (
          <div key={b.label} className="rounded-lg border border-gray-100 bg-white p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-md grid place-items-center ring-1 ${t.bg} ${t.text} ${t.ring}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.16em] text-gray-500">{b.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{b.count}</p>
            <p className="text-xs text-gray-500">
              {b.count > 0 ? formatRupeesCompact(b.arc) : '₹0'}
              <span className="text-gray-400"> · {b.sub}</span>
            </p>
          </div>
        );
      })}
    </section>
  );
}

/*
 * Activity timeline — chronological feed of changes + meetings + MOMs
 * the SAM has done over the past 30 days.
 */
function ActivityTimeline({ items }: { items: SamDetail['activityTimeline'] }) {
  if (items.length === 0) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="border-l-4 border-brand-600 pl-3 text-base font-semibold text-gray-900">
          Activity (last 30 days)
        </h2>
        <div className="rounded-lg border border-gray-100 bg-white p-10 text-center text-sm text-gray-400">
          No recent activity in the selected period.
        </div>
      </section>
    );
  }
  return (
    <section className="flex flex-col gap-3">
      <h2 className="border-l-4 border-brand-600 pl-3 text-base font-semibold text-gray-900">
        Activity (last 30 days · {items.length})
      </h2>
      <ol className="rounded-lg border border-gray-100 bg-white divide-y divide-gray-100">
        {items.map((it, i) => {
          const meta = activityIcon(it.type);
          const Icon = meta.icon;
          return (
            <li key={`${it.timestamp}-${i}`} className="flex items-center gap-4 px-5 py-3">
              <div className={`w-7 h-7 rounded-md grid place-items-center ring-1 ${meta.bg} ${meta.text} ${meta.ring}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{it.summary}</p>
                {it.customer && (
                  <Link
                    href={`/customers/${it.customer.id}`}
                    className="text-[11px] text-brand-600 hover:underline"
                  >
                    {it.customer.companyName || it.customer.clientName}
                  </Link>
                )}
              </div>
              <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">{relativeDay(it.timestamp)}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function activityIcon(type: SamDetail['activityTimeline'][number]['type']) {
  const map: Record<
    typeof type,
    { icon: React.ComponentType<{ className?: string }>; bg: string; text: string; ring: string }
  > = {
    CHANGE_COMMITTED: { icon: ClipboardList, bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-100' },
    CHANGE_RETAINED: { icon: ShieldCheck, bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-100' },
    CHANGE_PROCEEDED: { icon: XCircle, bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-100' },
    MEETING_HELD: { icon: CalendarClock, bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-100' },
    MOM_SENT: { icon: FileCheck2, bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-100' },
    CUSTOMER_ASSIGNED: { icon: Activity, bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-100' },
  };
  return map[type];
}

// ── tiny date helpers ────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function groupByDay(
  items: MeetingDayItem[],
): Array<{ key: string; label: string; meetings: MeetingDayItem[] }> {
  const byDay = new Map<string, MeetingDayItem[]>();
  for (const m of items) {
    const d = new Date(m.when);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const arr = byDay.get(key) ?? [];
    arr.push(m);
    byDay.set(key, arr);
  }
  return Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, meetings]) => {
      const d = new Date(meetings[0].when);
      const label = `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
      return { key, label, meetings };
    });
}

function timeOnly(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function relativeDay(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
