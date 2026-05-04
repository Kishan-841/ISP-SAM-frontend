import {
  Users,
  BarChart3,
  Clock,
  TrendingUp,
  AlertTriangle,
  UserX,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader, SectionHeading } from '../../components/page-header';
import { StatCard } from '../../components/stat-card';
import { Card, CardContent } from '@/components/ui/card';
import { StatusPill, type PillTone } from '../../components/status-pill';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { getNewBaseMetrics } from '../../services/dashboard';
import { formatDate } from '../../lib/format-date';

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

  return (
    <div className="px-8 py-6 flex flex-col gap-8">
      <PageHeader
        title="New Base Dashboard"
        subtitle="Growth & velocity (post-April 1 customers)"
      />

      {/* Headline */}
      <section className="flex flex-col gap-3">
        <SectionHeading>Headline</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total New Customers"
            value={metrics.totalCustomers.toString()}
            subtitle="Active NEW-kitty accounts"
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            href="/customers?kittyType=NEW"
          />
          <StatCard
            title="Total New ARC"
            value={`₹${metrics.totalNewArcLakh.toFixed(1)}L`}
            subtitle="Annual recurring contribution"
            icon={BarChart3}
            iconBg="bg-orange-50"
            iconColor="text-brand-600"
          />
          <StatCard
            title="Avg Time to First MOM"
            value={ttfm}
            subtitle="Onboarding → first MOM"
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
              <table className="w-full text-sm">
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
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
