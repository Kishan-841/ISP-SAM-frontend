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
import { getCookieHeader } from '../../lib/get-cookie-header';
import { getExistingBaseMetrics } from '../../services/dashboard';

export default async function ExistingBaseDashboardPage() {
  const cookieHeader = await getCookieHeader();
  const metrics = await getExistingBaseMetrics({ cookieHeader });
  const terminatedArcLakh = metrics.totalBaseArcLakh - metrics.currentArcLakh;

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
            title="Upgrades (1)"
            value="+₹3.6L"
            subtitle="ARC added"
            icon={TrendingUp}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            valueColor="text-emerald-600"
          />
          <StatCard
            title="Downgrades (1)"
            value="-₹1.2L"
            subtitle="ARC reduced"
            icon={TrendingDown}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            valueColor="text-amber-600"
          />
          <StatCard
            title="Rate Revisions (1)"
            value="₹0"
            subtitle="Bandwidth uplift; ARC neutral or down"
            icon={Shield}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
          />
          <StatCard
            title="Terminations (0)"
            value="-₹0.0"
            subtitle="ARC lost"
            icon={UserX}
            iconBg="bg-red-50"
            iconColor="text-red-600"
            valueColor="text-red-600"
          />
        </div>
      </section>

      <section>
        <SectionHeading>Revenue Waterfall (ARC)</SectionHeading>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 h-72 grid place-items-center text-gray-400 text-sm">
          Chart placeholder — bars: ₹90L, ₹60L, ₹30L y-axis
        </div>
      </section>
    </div>
  );
}
