import {
  Users,
  BarChart3,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  AlertTriangle,
  UserX,
  Sparkles,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader, SectionHeading } from '../../components/page-header';
import { StatCard } from '../../components/stat-card';
import { Card, CardContent } from '@/components/ui/card';
import { StatusPill, type PillTone } from '../../components/status-pill';
import { RevenueWaterfall } from '../../components/revenue-waterfall';
import { WaterfallDetail } from '../../components/waterfall-detail';
import { ExpandableArc } from '../../components/expandable-arc';
import { DeltaTrend } from '../../components/delta-trend';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { getNewBaseMetrics } from '../../services/dashboard';
import { formatDate } from '../../lib/format-date';
import { formatRupeesCompact } from '../../lib/format-rupees';

// Match existing-base — guarantee a fresh server render so the data
// updates immediately on navigation back to the page.
export const dynamic = 'force-dynamic';

const LAKH = 100_000;

const STATUS_TONE: Record<string, PillTone> = {
  ACTIVE: 'emerald',
  PENDING: 'amber',
  EXPIRED: 'red',
  TERMINATED: 'gray',
};

export default async function NewBaseDashboardPage() {
  const cookieHeader = await getCookieHeader();
  const metrics = await getNewBaseMetrics({ cookieHeader });

  const ttfm =
    metrics.avgTimeToFirstMomDays === null
      ? '—'
      : `${metrics.avgTimeToFirstMomDays} days`;

  // Convert lakh-denominated metrics into rupees so formatRupeesCompact can
  // render them the same way the existing-base dashboard does.
  const startArcRupees = metrics.totalNewArcLakh * LAKH;
  const currentArcRupees = metrics.currentArcLakh * LAKH;
  const upgradesArcRupees = metrics.upgrades.arcAddedLakh * LAKH;
  const downgradesArcRupees = metrics.downgrades.arcReducedLakh * LAKH;
  const terminationsArcRupees = metrics.terminations.arcLostLakh * LAKH;
  const probableChurnArcRupees = metrics.probableChurn.arcAtRiskLakh * LAKH;
  const pendingArcRupees = metrics.pending.netArcLakh * LAKH;
  const netDeltaRupees = currentArcRupees - startArcRupees;
  // Waterfall ends at live Current ARC (mirrors existing-base); pending CRM
  // adjustment is rendered as its own row so the chain reconciles.
  const waterfallInput = {
    startArcRupees,
    upgradesArcRupees,
    downgradesArcRupees,
    terminationsArcRupees,
    endArcRupees: currentArcRupees,
    pendingArcRupees,
    pendingCount: metrics.pending.count,
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl flex flex-col gap-6 sm:gap-8">
      <PageHeader
        title="New Base Dashboard"
        subtitle="Growth & velocity (post-April 1 customers)"
      />

      {/* Components — mirrors existing-base */}
      <section className="flex flex-col gap-3">
        <SectionHeading>Components</SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard
            title="Total New Customers"
            value={metrics.totalCustomers.toString()}
            subtitle="All NEW-kitty since April 1"
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            href="/customers?kittyType=NEW"
          />
          <StatCard
            title="Total New ARC (at onboarding)"
            value={<ExpandableArc value={startArcRupees} />}
            subtitle="Sum of starting ARC across NEW base"
            icon={BarChart3}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            href="/customers?kittyType=NEW"
          />
          <StatCard
            title="Current Customers"
            value={metrics.currentCustomers.toString()}
            subtitle={`${metrics.totalCustomers} total · ${metrics.terminatedCount} terminated`}
            icon={Users}
            iconBg="bg-orange-50"
            iconColor="text-brand-600"
            href="/customers?kittyType=NEW&status=ACTIVE"
          />
          <StatCard
            title="Current ARC"
            value={<ExpandableArc value={currentArcRupees} />}
            subtitle={
              <DeltaTrend value={netDeltaRupees}>
                <ExpandableArc value={netDeltaRupees} signed className="text-xs" />
                <span className="text-gray-500">since onboarding</span>
              </DeltaTrend>
            }
            icon={
              netDeltaRupees > 0 ? TrendingUp : netDeltaRupees < 0 ? TrendingDown : Minus
            }
            iconBg={
              netDeltaRupees > 0
                ? 'bg-emerald-50'
                : netDeltaRupees < 0
                  ? 'bg-red-50'
                  : 'bg-gray-50'
            }
            iconColor={
              netDeltaRupees > 0
                ? 'text-emerald-600'
                : netDeltaRupees < 0
                  ? 'text-red-600'
                  : 'text-gray-400'
            }
            href="/customers?kittyType=NEW&status=ACTIVE"
          />
        </div>

        {metrics.probableChurn.count > 0 && (
          <Link
            href="/probable-churn"
            className="group flex items-center justify-between gap-4 mb-4 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 transition-[background-color,border-color,transform] duration-200 ease-[var(--ease-out)] hoverable:hover:bg-amber-100 hoverable:hover:border-amber-300 active:scale-[0.995]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-md grid place-items-center shrink-0 bg-amber-100 text-amber-700">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex flex-col">
                <p className="text-sm font-semibold text-amber-900">
                  {metrics.probableChurn.count} customer{metrics.probableChurn.count === 1 ? '' : 's'}{' '}
                  in the retention queue
                </p>
                <p className="text-xs text-amber-800">
                  {formatRupeesCompact(probableChurnArcRupees)} ARC at risk — excluded from Current ARC
                  until disconnection is decided.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-900 whitespace-nowrap">
              Review retention queue
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 ease-[var(--ease-out)] hoverable:group-hover:translate-x-0.5" />
            </span>
          </Link>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={`Upgrades (${metrics.upgrades.count})`}
            value={<ExpandableArc value={Math.abs(upgradesArcRupees)} signed />}
            subtitle="ARC added"
            icon={TrendingUp}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            valueColor="text-emerald-600"
            href={metrics.upgrades.count > 0 ? '/new-base/upgrades' : undefined}
          />
          <StatCard
            title={`Downgrades (${metrics.downgrades.count})`}
            value={<ExpandableArc value={-Math.abs(downgradesArcRupees)} signed />}
            subtitle="ARC reduced"
            icon={TrendingDown}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            valueColor="text-amber-600"
            href={metrics.downgrades.count > 0 ? '/new-base/downgrades' : undefined}
          />
          <StatCard
            title="Rate Revisions"
            value={metrics.rateRevisions.count.toString()}
            subtitle={
              metrics.rateRevisions.count === 1
                ? '1 customer — bandwidth uplift at the same ARC'
                : `${metrics.rateRevisions.count} customers — bandwidth uplift at the same ARC`
            }
            icon={Shield}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
            href={metrics.rateRevisions.count > 0 ? '/new-base/rate-revisions' : undefined}
          />
          <StatCard
            title={`Disconnections (${metrics.terminations.count})`}
            value={<ExpandableArc value={-Math.abs(terminationsArcRupees)} signed />}
            subtitle="ARC lost"
            icon={UserX}
            iconBg="bg-red-50"
            iconColor="text-red-600"
            valueColor="text-red-600"
            href={metrics.terminations.count > 0 ? '/new-base/disconnections' : undefined}
          />
        </div>
      </section>

      {/* Revenue waterfall — mirrors existing-base. */}
      <section className="flex flex-col gap-3">
        <SectionHeading>Revenue Waterfall (ARC)</SectionHeading>
        <RevenueWaterfall
          input={waterfallInput}
          startLabel="Onboarding"
          counts={{
            upgrades: metrics.upgrades.count,
            downgrades: metrics.downgrades.count,
            terminations: metrics.terminations.count,
          }}
        />
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeading>Waterfall — Detail (ARC)</SectionHeading>
        <WaterfallDetail input={waterfallInput} kittyType="NEW" />
      </section>

      {/* Onboarding efficiency — single MOM card kept from old layout */}
      <section className="flex flex-col gap-3">
        <SectionHeading>Onboarding</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Avg Time to First MOM"
            value={ttfm}
            subtitle="Onboarding → first MOM sent"
            icon={Clock}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />
        </div>
      </section>

      {/* Velocity */}
      <section className="flex flex-col gap-3">
        <SectionHeading>Velocity</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title={`Added This Month (${metrics.addedThisMonth.count})`}
            value={`+₹${metrics.addedThisMonth.arcLakh.toFixed(1)}L`}
            subtitle="ARC added"
            icon={TrendingUp}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            valueColor="text-emerald-700"
          />
          <StatCard
            title={`Added This Quarter (${metrics.addedThisQuarter.count})`}
            value={`+₹${metrics.addedThisQuarter.arcLakh.toFixed(1)}L`}
            subtitle="FY-aligned quarter"
            icon={TrendingUp}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            valueColor="text-emerald-700"
          />
          <StatCard
            title={`Added This FY (${metrics.addedThisFy.count})`}
            value={`+₹${metrics.addedThisFy.arcLakh.toFixed(1)}L`}
            subtitle="Since April 1"
            icon={TrendingUp}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            valueColor="text-emerald-700"
          />
        </div>
      </section>

      {/* Onboarding Health & Handover Risk */}
      <section className="flex flex-col gap-3">
        <SectionHeading>Onboarding Health & Clean-Handover Risk</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Customers Without Any Meeting"
            value={metrics.customersWithoutMeeting.toString()}
            subtitle="SAM failure indicator (§4.6)"
            icon={UserX}
            iconBg="bg-red-50"
            iconColor="text-red-600"
            valueColor={metrics.customersWithoutMeeting > 0 ? 'text-red-700' : undefined}
          />
          <StatCard
            title="Immediate Rate Revisions"
            value={metrics.immediateRateRevisions.toString()}
            subtitle="Within 60 days · sales mispricing"
            icon={AlertTriangle}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            valueColor={metrics.immediateRateRevisions > 0 ? 'text-amber-700' : undefined}
          />
          <StatCard
            title="Early Downgrades"
            value={metrics.earlyDowngrades.toString()}
            subtitle="Within 60 days · bad qualification"
            icon={AlertTriangle}
            iconBg="bg-red-50"
            iconColor="text-red-600"
            valueColor={metrics.earlyDowngrades > 0 ? 'text-red-700' : undefined}
          />
          <StatCard
            title={`Early Growth Upgrades (${metrics.earlyUpgrades.count})`}
            value={`+₹${metrics.earlyUpgrades.arcAddedLakh.toFixed(1)}L`}
            subtitle="Within 6 months · expansion"
            icon={Sparkles}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            valueColor="text-emerald-700"
          />
        </div>
      </section>

      {/* Recent additions */}
      <section className="flex flex-col gap-3">
        <SectionHeading>Recent Additions</SectionHeading>
        <Card>
          <CardContent className="p-0 overflow-hidden">
            {metrics.recentAdditions.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No new customers yet. Trigger an activation in the CRM (or run
                <code className="mx-1 px-1.5 py-0.5 rounded bg-gray-100 font-mono text-xs">
                  scripts/mock-crm.ts
                </code>
                ) and they'll appear here.
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="bg-gray-50/60 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-700">
                  <tr className="divide-x divide-gray-100">
                    <th className="px-5 py-3 text-left font-semibold">Customer</th>
                    <th className="px-5 py-3 text-left font-semibold">Code</th>
                    <th className="px-5 py-3 text-left font-semibold">Onboarded</th>
                    <th className="px-5 py-3 text-right font-semibold">ARC</th>
                    <th className="px-5 py-3 text-center font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {metrics.recentAdditions.map((a) => (
                    <tr key={a.id} className="divide-x divide-gray-100 hover:bg-gray-50/60">
                      <td className="px-5 py-4">
                        <Link
                          href="/customers?kittyType=NEW"
                          className="font-medium text-gray-900 hover:text-brand-600"
                        >
                          {a.companyName || a.clientName}
                        </Link>
                        {a.companyName && (
                          <div className="text-xs text-gray-500 mt-0.5">{a.clientName}</div>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-gray-600">
                        {a.customerCode ?? '—'}
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {formatDate(a.onboardingDate)}
                      </td>
                      <td className="px-5 py-4 text-right tabular-nums text-gray-900">
                        ₹{a.currentArcLakh.toFixed(1)}L
                      </td>
                      <td className="px-5 py-4 text-center">
                        <StatusPill tone={STATUS_TONE[a.contractStatus] ?? 'gray'}>
                          {a.contractStatus}
                        </StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
