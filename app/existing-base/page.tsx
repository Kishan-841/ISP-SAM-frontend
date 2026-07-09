import {
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  UserX,
  ShieldAlert,
  ClipboardCheck,
} from 'lucide-react';
import { PageHeader, SectionHeading } from '../../components/page-header';
import { StatCard } from '../../components/stat-card';
import { HoldingCard } from '../../components/holding-card';
import { QuarterFilter } from '../../components/quarter-filter';
import { RevenueWaterfall } from '../../components/revenue-waterfall';
import { WaterfallDetail } from '../../components/waterfall-detail';
import { ExpandableArc } from '../../components/expandable-arc';
import { DeltaTrend } from '../../components/delta-trend';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { getExistingBaseMetrics, type FyQuarter } from '../../services/dashboard';
import { formatRupeesCompact } from '../../lib/format-rupees';

// Quarter filter pushes ?quarter=Qx via router.push — the page must re-run
// for each value. Next 16 sometimes treats async `searchParams` pages as
// cache-eligible; this opt-out guarantees a fresh server render per request.
export const dynamic = 'force-dynamic';

const LAKH = 100_000;

const QUARTERS: ReadonlySet<string> = new Set(['Q1', 'Q2', 'Q3', 'Q4']);

function bucketHref(
  slug: 'upgrades' | 'downgrades' | 'rate-revisions' | 'disconnections',
  quarter: FyQuarter | undefined,
): string {
  const base = `/existing-base/${slug}`;
  return quarter ? `${base}?quarter=${quarter}` : base;
}

export default async function ExistingBaseDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ quarter?: string }>;
}) {
  const sp = await searchParams;
  const quarter = QUARTERS.has(sp.quarter ?? '') ? (sp.quarter as FyQuarter) : undefined;
  const cookieHeader = await getCookieHeader();
  const metrics = await getExistingBaseMetrics({ quarter }, { cookieHeader });
  // Convert metrics (lakh-denominated) into rupees for the chart + detail table.
  // NOTE: rate revisions are intentionally absent from the waterfall — they
  // preserve ARC by definition (bandwidth uplift at the same price), so the
  // count is surfaced on its own stat card and the financial view stays clean.
  const startArcRupees = metrics.totalBaseArcLakh * LAKH;
  const upgradesArcRupees = metrics.upgrades.arcAddedLakh * LAKH;
  const downgradesArcRupees = metrics.downgrades.arcReducedLakh * LAKH;
  const terminationsArcRupees = metrics.terminations.arcLostLakh * LAKH;
  const currentArcRupees = metrics.currentArcLakh * LAKH;
  const netDeltaRupees = currentArcRupees - startArcRupees;
  const probableChurnArcRupees = metrics.probableChurn.arcAtRiskLakh * LAKH;
  const pendingArcRupees = metrics.pending.netArcLakh * LAKH;
  // Guarded: the backend may not yet return `pendingApproval` during a deploy
  // where the frontend is ahead. Falls back to an empty (count 0) provision.
  const pendingApprovalCount = metrics.pendingApproval?.count ?? 0;
  const pendingApprovalArcRupees = (metrics.pendingApproval?.netArcLakh ?? 0) * LAKH;
  // Waterfall now ends at the LIVE Current ARC (matches the headline card)
  // and surfaces the pending CRM adjustment as its own row. The previous
  // computed endArc (start + buckets) implicitly assumed every committed
  // change had also been applied, which doesn't hold during CRM workflow.
  const waterfallInput = {
    startArcRupees,
    upgradesArcRupees,
    downgradesArcRupees,
    terminationsArcRupees,
    endArcRupees: currentArcRupees,
    // Probable churn is its own labeled row — NOT lumped into Pending CRM
    // settlement (which is now genuine CRM-in-flight only).
    probableChurnArcRupees,
    probableChurnCount: metrics.probableChurn.count,
    pendingArcRupees,
    pendingCount: metrics.pending.count,
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl">
      <PageHeader
        title="Existing Base Dashboard"
        subtitle={`${quarter ?? 'FYTD'} · April 1st Base accounts`}
        right={<QuarterFilter active={quarter} />}
      />

      <section className="mb-8">
        <SectionHeading>Components</SectionHeading>

        <div className="card-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard
            title="Total Customers (start of period)"
            value={metrics.totalCustomers.toString()}
            subtitle="April 1 Base headcount"
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            href="/customers?kittyType=BASE"
          />
          <StatCard
            title="Total Base ARC (start of period)"
            value={<ExpandableArc value={startArcRupees} />}
            subtitle="Annual recurring contribution"
            icon={BarChart3}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            href="/customers?kittyType=BASE"
          />
          <StatCard
            title="Current Customers"
            value={metrics.currentCustomers.toString()}
            subtitle={`${metrics.totalCustomers} start · ${metrics.terminatedCount} terminated`}
            icon={Users}
            iconBg="bg-orange-50"
            iconColor="text-brand-600"
            href="/customers?kittyType=BASE&status=ACTIVE"
          />
          <StatCard
            title="Current ARC"
            value={<ExpandableArc value={currentArcRupees} />}
            subtitle={
              <DeltaTrend value={netDeltaRupees}>
                <ExpandableArc value={netDeltaRupees} signed className="text-xs" />
                <span className="text-gray-500">since April 1</span>
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
            href="/customers?kittyType=BASE&status=ACTIVE"
          />
        </div>

        {(pendingApprovalCount > 0 || metrics.probableChurn.count > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {pendingApprovalCount > 0 && (
              <HoldingCard
                tone="indigo"
                icon={ClipboardCheck}
                count={pendingApprovalCount}
                headline={
                  pendingApprovalCount === 1
                    ? 'change awaiting approval'
                    : 'changes awaiting approval'
                }
                detail="Not yet in Current ARC — applies once approved."
                amount={
                  pendingApprovalArcRupees === 0
                    ? '—'
                    : formatRupeesCompact(pendingApprovalArcRupees, { signed: true })
                }
                amountClassName={
                  pendingApprovalArcRupees > 0
                    ? 'text-emerald-600'
                    : pendingApprovalArcRupees < 0
                      ? 'text-red-600'
                      : 'text-gray-400'
                }
                href="/transactions"
                cta="View pending"
              />
            )}
            {metrics.probableChurn.count > 0 && (
              <HoldingCard
                tone="amber"
                icon={ShieldAlert}
                count={metrics.probableChurn.count}
                headline={
                  metrics.probableChurn.count === 1
                    ? 'customer in the retention queue'
                    : 'customers in the retention queue'
                }
                detail="ARC at risk — excluded until disconnection is decided."
                amount={formatRupeesCompact(probableChurnArcRupees)}
                href="/probable-churn"
                cta="Review retention"
              />
            )}
          </div>
        )}

        <div className="card-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={`Upgrades (${metrics.upgrades.count})`}
            value={<ExpandableArc value={Math.abs(upgradesArcRupees)} signed />}
            subtitle="ARC added"
            icon={TrendingUp}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            valueColor="text-emerald-600"
            href={metrics.upgrades.count > 0 ? bucketHref('upgrades', quarter) : undefined}
          />
          <StatCard
            title={`Downgrades (${metrics.downgrades.count})`}
            value={<ExpandableArc value={-Math.abs(downgradesArcRupees)} signed />}
            subtitle="ARC reduced"
            icon={TrendingDown}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            valueColor="text-amber-600"
            href={metrics.downgrades.count > 0 ? bucketHref('downgrades', quarter) : undefined}
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
            href={
              metrics.rateRevisions.count > 0 ? bucketHref('rate-revisions', quarter) : undefined
            }
          />
          <StatCard
            title={`Disconnections (${metrics.terminations.count})`}
            value={<ExpandableArc value={-Math.abs(terminationsArcRupees)} signed />}
            subtitle="ARC lost"
            icon={UserX}
            iconBg="bg-red-50"
            iconColor="text-red-600"
            valueColor="text-red-600"
            href={metrics.terminations.count > 0 ? bucketHref('disconnections', quarter) : undefined}
          />
        </div>
      </section>

      <section className="mb-8">
        <SectionHeading>Revenue Waterfall (ARC)</SectionHeading>
        <RevenueWaterfall
          input={waterfallInput}
          counts={{
            upgrades: metrics.upgrades.count,
            downgrades: metrics.downgrades.count,
            terminations: metrics.terminations.count,
          }}
        />
      </section>

      <section className="mb-8">
        <SectionHeading>Waterfall — Detail (ARC)</SectionHeading>
        <WaterfallDetail input={waterfallInput} />
      </section>
    </div>
  );
}
