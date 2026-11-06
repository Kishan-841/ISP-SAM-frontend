import { MapPin, Building2, Users, IndianRupee, TriangleAlert } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { getMe } from '../../services/auth';
import { getGeography, type Geography } from '../../services/geography';
import { PageHeader, SectionHeading } from '../../components/page-header';
import { StatCard } from '../../components/stat-card';
import { GeographyTable } from '../../components/geography-table';
import {
  ArcByZoneChart,
  ArcCoverageBar,
  CustomersByZoneChart,
  TopCitiesChart,
} from '../../components/geography-charts';
import { formatRupees, formatRupeesCompact } from '../../lib/format-rupees';

const ALLOWED_ROLES = ['ADMIN', 'SAM_HEAD', 'SUPER_ADMIN_2'] as const;

export default async function GeographyPage() {
  const cookieHeader = await getCookieHeader();
  const me = await getMe({ cookieHeader });
  if (!(ALLOWED_ROLES as readonly string[]).includes(me.user.role)) {
    redirect('/');
  }

  let data: Geography | null = null;
  let loadError = false;
  try {
    data = await getGeography({}, { cookieHeader });
  } catch {
    // Backend may not expose /dashboard/geography yet (deploy skew) — fail soft
    // rather than 500 the whole page.
    loadError = true;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl flex flex-col gap-6">
      <PageHeader
        title="Zones & Cities"
        subtitle="Customer count and ARC by service zone and city. Zone and city come from the CRM on activation; terminated accounts are excluded."
      />

      {loadError || !data ? (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 p-8 text-center">
          <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">
            Zone analytics aren&apos;t available yet
          </p>
          <p className="text-xs text-gray-500 mt-1">
            This view needs the latest backend. If it was just deployed, refresh in a minute.
          </p>
        </div>
      ) : (
        <GeographyBody data={data} />
      )}
    </div>
  );
}

function GeographyBody({ data }: { data: Geography }) {
  const { totals, zones, cities, unmapped } = data;
  const nothingMapped = totals.mappedCustomerCount === 0;

  return (
    <>
      {/* Coverage is the first thing leadership needs: a zone breakdown over
          40% of the book is a different claim than one over 100% of it. */}
      {unmapped.customerCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <TriangleAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-amber-900">
              {nothingMapped
                ? 'No customer carries a zone yet'
                : `${unmapped.customerCount} of ${totals.customerCount} customers have no zone yet`}
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
              {formatRupees(unmapped.totalArc)} of ARC sits outside this breakdown. Zone and city
              arrive from the CRM on <code className="font-mono">customer.activated</code>{' '}
              — run the CRM&apos;s customer resync to backfill the customers SAM already holds.
            </p>
          </div>
        </div>
      )}

      {/* Headline */}
      <section>
        <SectionHeading>Coverage</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Zones live"
            value={totals.zoneCount.toString()}
            subtitle={
              totals.zoneCount === 0 ? 'None assigned yet' : 'Zones with at least one customer'
            }
            icon={MapPin}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Cities live"
            value={totals.cityCount.toString()}
            subtitle={
              totals.cityCount === 0 ? 'None assigned yet' : 'Cities with at least one customer'
            }
            icon={Building2}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
          />
          <StatCard
            title="Mapped customers"
            value={`${totals.coveragePercent}%`}
            subtitle={`${totals.mappedCustomerCount} of ${totals.customerCount} carry a zone`}
            icon={Users}
            iconBg={totals.coveragePercent >= 90 ? 'bg-emerald-50' : 'bg-amber-50'}
            iconColor={totals.coveragePercent >= 90 ? 'text-emerald-600' : 'text-amber-600'}
            valueColor={totals.coveragePercent >= 90 ? 'text-emerald-700' : 'text-amber-700'}
          />
          <StatCard
            title="Mapped ARC"
            value={formatRupeesCompact(totals.mappedArc)}
            subtitle={`of ${formatRupeesCompact(totals.totalArc)} live ARC`}
            icon={IndianRupee}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
        </div>
      </section>

      {!nothingMapped && (
        <section>
          <SectionHeading>Distribution</SectionHeading>
          <div className="flex flex-col gap-4">
            <ArcCoverageBar zones={zones} unmapped={unmapped} totalArc={totals.totalArc} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ArcByZoneChart zones={zones} />
              <CustomersByZoneChart zones={zones} />
            </div>
            <TopCitiesChart cities={cities} />
          </div>
        </section>
      )}

      <section>
        <SectionHeading>Zone breakdown</SectionHeading>
        <p className="text-xs text-gray-500 mb-3">
          Click a zone to see its cities. Share is of mapped ARC
          {unmapped.totalArc > 0 ? ' — unmapped customers sit outside it.' : '.'}
        </p>
        <GeographyTable zones={zones} unmapped={unmapped} />
      </section>
    </>
  );
}
