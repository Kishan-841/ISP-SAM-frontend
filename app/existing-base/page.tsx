import {
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Shield,
  UserX,
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
  const startArcRupees = metrics.totalBaseArcLakh * LAKH;
  const upgradesArcRupees = metrics.upgrades.arcAddedLakh * LAKH;
  const downgradesArcRupees = metrics.downgrades.arcReducedLakh * LAKH;
  const rateRevisionsArcRupees = metrics.rateRevisions.arcChangeLakh * LAKH;
  const terminationsArcRupees = metrics.terminations.arcLostLakh * LAKH;
  const endArcRupees =
    startArcRupees +
    upgradesArcRupees -
    downgradesArcRupees -
    rateRevisionsArcRupees -
    terminationsArcRupees;
  const currentArcRupees = metrics.currentArcLakh * LAKH;
  const netDeltaRupees = currentArcRupees - startArcRupees;
  const waterfallInput = {
    startArcRupees,
    upgradesArcRupees,
    downgradesArcRupees,
    rateRevisionsArcRupees,
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={`Upgrades (${metrics.upgrades.count})`}
            value={formatRupeesCompact(Math.abs(upgradesArcRupees), { signed: true })}
            subtitle="ARC added"
            icon={TrendingUp}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            valueColor="text-emerald-600"
            href="/transactions?type=UPGRADE"
          />
          <StatCard
            title={`Downgrades (${metrics.downgrades.count})`}
            value={formatRupeesCompact(-Math.abs(downgradesArcRupees), { signed: true })}
            subtitle="ARC reduced"
            icon={TrendingDown}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            valueColor="text-amber-600"
            href="/transactions?type=DOWNGRADE"
          />
          <StatCard
            title={`Rate Revisions (${metrics.rateRevisions.count})`}
            value={formatRupeesCompact(-Math.abs(rateRevisionsArcRupees), { signed: true })}
            subtitle="Bandwidth uplift; ARC neutral or down"
            icon={Shield}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
            href="/transactions?type=RATE_REVISION"
          />
          <StatCard
            title={`Disconnections (${metrics.terminations.count})`}
            value={formatRupeesCompact(-Math.abs(terminationsArcRupees), { signed: true })}
            subtitle="ARC lost"
            icon={UserX}
            iconBg="bg-red-50"
            iconColor="text-red-600"
            valueColor="text-red-600"
            href="/transactions?type=DISCONNECTION"
          />
        </div>
      </section>

      <section className="mb-8">
        <SectionHeading>Revenue Waterfall (ARC)</SectionHeading>
        <RevenueWaterfall input={waterfallInput} />
      </section>

      <section className="mb-8">
        <SectionHeading>Waterfall — Detail (ARC)</SectionHeading>
        <WaterfallDetail input={waterfallInput} />
      </section>
    </div>
  );
}
