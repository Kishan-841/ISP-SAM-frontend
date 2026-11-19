import { MapPin, Building2, Users, IndianRupee, TriangleAlert, Factory } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { getMe } from '../../services/auth';
import { getGeography, type Geography } from '../../services/geography';
import { PageHeader, SectionHeading } from '../../components/page-header';
import { StatCard } from '../../components/stat-card';
import { GeographyTable } from '../../components/geography-table';
import {
  ArcByIndustryChart,
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
  const { totals, zones, cities, unmapped, industry } = data;
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

      {/* Industry — the same book cut a different way. Deliberately its own
          section with its own coverage figure: a customer can have a zone
          and no industry, so one number can't speak for both. */}
      <section>
        <SectionHeading>Industry</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard
            title="Industries live"
            value={industry.totals.industryCount.toString()}
            subtitle={
              industry.totals.industryCount === 0
                ? 'None recorded yet'
                : 'Industries with at least one customer'
            }
            icon={Factory}
            iconBg="bg-orange-50"
            iconColor="text-orange-600"
          />
          <StatCard
            title="Classified customers"
            value={`${industry.totals.coveragePercent}%`}
            subtitle={`${industry.totals.mappedCustomerCount} of ${totals.customerCount} carry an industry`}
            icon={Users}
            iconBg={industry.totals.coveragePercent >= 90 ? 'bg-emerald-50' : 'bg-amber-50'}
            iconColor={industry.totals.coveragePercent >= 90 ? 'text-emerald-600' : 'text-amber-600'}
            valueColor={industry.totals.coveragePercent >= 90 ? 'text-emerald-700' : 'text-amber-700'}
          />
          <StatCard
            title="Classified ARC"
            value={formatRupeesCompact(industry.totals.mappedArc)}
            subtitle={`of ${formatRupeesCompact(totals.totalArc)} live ARC`}
            icon={IndianRupee}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatCard
            title="Largest industry"
            value={industry.rows[0]?.name ?? '—'}
            subtitle={
              industry.rows[0]
                ? `${formatRupeesCompact(industry.rows[0].totalArc)} · ${industry.rows[0].arcSharePercent}% of classified ARC`
                : 'Nothing classified yet'
            }
            icon={Factory}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
        </div>

        {industry.rows.length > 0 && (
          <div className="flex flex-col gap-4">
            <ArcByIndustryChart industries={industry.rows} />
            <IndustryTable industry={industry} />
          </div>
        )}
        {industry.rows.length === 0 && (
          <div className="bg-white rounded-xl ring-1 ring-gray-200 p-8 text-center">
            <Factory className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">No industry recorded yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Add an Industry column to the zone &amp; city spreadsheet on Excel Import to fill
              this in.
            </p>
          </div>
        )}
      </section>

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


/**
 * Plain server-rendered table — no expansion, so no client component needed.
 * Share is of CLASSIFIED ARC, matching the zone table's convention of
 * denominating in the mapped subset rather than the whole book.
 */
function IndustryTable({ industry }: { industry: Geography['industry'] }) {
  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[680px]">
          <thead className="bg-gray-50/60 border-b border-gray-100">
            <tr>
              <Th>Industry</Th>
              <Th align="right">Customers</Th>
              <Th align="right">Base</Th>
              <Th align="right">New</Th>
              <Th align="right">ARC</Th>
              <Th align="right">Avg / customer</Th>
              <Th align="right">Share</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {industry.rows.map((r) => (
              <tr key={r.name} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <Factory className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span className="font-medium text-gray-900">{r.name}</span>
                  </div>
                </td>
                <Td>{r.customerCount}</Td>
                <Td muted>{r.baseCount}</Td>
                <Td muted>{r.newCount}</Td>
                <Td title={formatRupees(r.totalArc)}>{formatRupeesCompact(r.totalArc)}</Td>
                <Td muted title={formatRupees(r.avgArc)}>
                  {formatRupeesCompact(r.avgArc)}
                </Td>
                <Td muted>{r.arcSharePercent}%</Td>
              </tr>
            ))}
            {industry.unmapped.customerCount > 0 && (
              <tr className="bg-amber-50/40">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <Factory className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-700">No industry set</span>
                  </div>
                </td>
                <Td>{industry.unmapped.customerCount}</Td>
                <Td muted>—</Td>
                <Td muted>—</Td>
                <Td title={formatRupees(industry.unmapped.totalArc)}>
                  {formatRupeesCompact(industry.unmapped.totalArc)}
                </Td>
                <Td muted>—</Td>
                <Td muted>—</Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-900 whitespace-nowrap ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  muted,
  title,
}: {
  children: React.ReactNode;
  muted?: boolean;
  title?: string;
}) {
  return (
    <td
      title={title}
      className={`px-5 py-3.5 text-right tabular-nums whitespace-nowrap ${
        muted ? 'text-gray-600' : 'font-medium text-gray-900'
      }`}
    >
      {children}
    </td>
  );
}
