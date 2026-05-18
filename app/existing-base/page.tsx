import Link from 'next/link';
import {
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Shield,
  UserX,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { PageHeader, SectionHeading } from '../../components/page-header';
import { StatCard } from '../../components/stat-card';
import { QuarterFilter } from '../../components/quarter-filter';
import { RevenueWaterfall } from '../../components/revenue-waterfall';
import { WaterfallDetail } from '../../components/waterfall-detail';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { getExistingBaseMetrics, type FyQuarter } from '../../services/dashboard';
import { formatRupeesCompact } from '../../lib/format-rupees';

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
  const endArcRupees =
    startArcRupees + upgradesArcRupees - downgradesArcRupees - terminationsArcRupees;
  const currentArcRupees = metrics.currentArcLakh * LAKH;
  const netDeltaRupees = currentArcRupees - startArcRupees;
  const probableChurnArcRupees = metrics.probableChurn.arcAtRiskLakh * LAKH;
  const waterfallInput = {
    startArcRupees,
    upgradesArcRupees,
    downgradesArcRupees,
    terminationsArcRupees,
    endArcRupees,
  };

  return (
    <div className="px-8 py-6 max-w-7xl">
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
            value={formatRupeesCompact(startArcRupees)}
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
            value={formatRupeesCompact(currentArcRupees)}
            subtitle={`Δ ${formatRupeesCompact(netDeltaRupees, { signed: true })} since April 1`}
            icon={BarChart3}
            iconBg="bg-orange-50"
            iconColor="text-brand-600"
            href="/customers?kittyType=BASE&status=ACTIVE"
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

        <div className="card-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={`Upgrades (${metrics.upgrades.count})`}
            value={formatRupeesCompact(Math.abs(upgradesArcRupees), { signed: true })}
            subtitle="ARC added"
            icon={TrendingUp}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            valueColor="text-emerald-600"
            href={metrics.upgrades.count > 0 ? bucketHref('upgrades', quarter) : undefined}
          />
          <StatCard
            title={`Downgrades (${metrics.downgrades.count})`}
            value={formatRupeesCompact(-Math.abs(downgradesArcRupees), { signed: true })}
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
            value={formatRupeesCompact(-Math.abs(terminationsArcRupees), { signed: true })}
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
