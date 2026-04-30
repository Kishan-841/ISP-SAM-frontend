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
import { getExistingBaseMetrics } from '../../services/dashboard';

const LAKH = 100_000;

export default async function ExistingBaseDashboardPage() {
  const cookieHeader = await getCookieHeader();
  const metrics = await getExistingBaseMetrics({ cookieHeader });
  const terminatedArcLakh = metrics.totalBaseArcLakh - metrics.currentArcLakh;

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
        subtitle="FYTD · April 1st Base accounts"
        right={<QuarterFilter />}
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
          />
          <StatCard
            title="Total Base ARC (start of period)"
            value={`₹${metrics.totalBaseArcLakh.toFixed(1)}L`}
            subtitle={`MRR ₹${metrics.totalBaseMrrLakh.toFixed(1)}L × 12`}
            icon={BarChart3}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
          <StatCard
            title="Current Customers"
            value={metrics.currentCustomers.toString()}
            subtitle={`= ${metrics.totalCustomers} start - ${metrics.terminatedCount} terminated`}
            icon={Users}
            iconBg="bg-orange-50"
            iconColor="text-brand-600"
          />
          <StatCard
            title="Current ARC"
            value={`₹${metrics.currentArcLakh.toFixed(1)}L`}
            subtitle={`= ₹${metrics.totalBaseArcLakh.toFixed(1)}L start - ₹${terminatedArcLakh.toFixed(1)}L terminated`}
            icon={BarChart3}
            iconBg="bg-orange-50"
            iconColor="text-brand-600"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={`Upgrades (${metrics.upgrades.count})`}
            value={`+₹${metrics.upgrades.arcAddedLakh.toFixed(1)}L`}
            subtitle="ARC added"
            icon={TrendingUp}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            valueColor="text-emerald-600"
          />
          <StatCard
            title={`Downgrades (${metrics.downgrades.count})`}
            value={`-₹${metrics.downgrades.arcReducedLakh.toFixed(1)}L`}
            subtitle="ARC reduced"
            icon={TrendingDown}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            valueColor="text-amber-600"
          />
          <StatCard
            title={`Rate Revisions (${metrics.rateRevisions.count})`}
            value={`₹${metrics.rateRevisions.arcChangeLakh.toFixed(1)}L`}
            subtitle="Bandwidth uplift; ARC neutral or down"
            icon={Shield}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
          />
          <StatCard
            title={`Terminations (${metrics.terminations.count})`}
            value={`-₹${metrics.terminations.arcLostLakh.toFixed(1)}L`}
            subtitle="ARC lost"
            icon={UserX}
            iconBg="bg-red-50"
            iconColor="text-red-600"
            valueColor="text-red-600"
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
