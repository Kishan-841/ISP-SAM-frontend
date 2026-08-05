import { CalendarClock, Users, Timer, MapPin, Wifi } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { getMe } from '../../services/auth';
import { getMeetingSummary, type MeetingSummary } from '../../services/meeting-summary';
import { PageHeader, SectionHeading } from '../../components/page-header';
import { StatCard } from '../../components/stat-card';
import { MeetingRangeFilter } from '../../components/meeting-range-filter';
import {
  MeetingsPerSamChart,
  MeetingsTrendChart,
} from '../../components/meeting-summary-charts';

const ALLOWED_ROLES = ['ADMIN', 'SAM_HEAD', 'SUPER_ADMIN_2'] as const;

export default async function MeetingSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const cookieHeader = await getCookieHeader();
  const me = await getMe({ cookieHeader });
  if (!(ALLOWED_ROLES as readonly string[]).includes(me.user.role)) {
    redirect('/');
  }

  const { from, to } = await searchParams;

  let data: MeetingSummary | null = null;
  let loadError = false;
  try {
    data = await getMeetingSummary({ from, to }, { cookieHeader });
  } catch {
    // Backend may not yet expose /dashboard/meeting-summary (deploy skew) — fail soft.
    loadError = true;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl flex flex-col gap-6">
      <PageHeader
        title="Meeting Summary"
        subtitle={`Meetings held ${rangeLabel(from, to)} · online vs offline, coverage, and MOM turnaround.`}
      />

      <MeetingRangeFilter from={from} to={to} />

      {loadError || !data ? (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 p-8 text-center">
          <CalendarClock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">Meeting analytics aren&apos;t available yet</p>
          <p className="text-xs text-gray-500 mt-1">
            This view needs the latest backend. If it was just deployed, refresh in a minute.
          </p>
        </div>
      ) : (
        <MeetingSummaryBody data={data} />
      )}
    </div>
  );
}

function MeetingSummaryBody({ data }: { data: MeetingSummary }) {
  const { team, sams, trend } = data;

  return (
    <>
      {/* Headline cards */}
      <section>
        <SectionHeading>Team headline</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Meetings held"
            value={team.held.toString()}
            subtitle={
              team.held === 0
                ? 'No meetings in this range'
                : `${team.online} online · ${team.offline} offline`
            }
            icon={CalendarClock}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <StatCard
            title="Customers met"
            value={team.customersMet.toString()}
            subtitle={
              team.customersMet === 0
                ? 'No customers met yet'
                : 'Distinct accounts with a held meeting'
            }
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Avg MOM turnaround"
            value={formatTurnaround(team.avgMomTurnaroundHours)}
            subtitle={
              team.avgMomTurnaroundHours === null
                ? 'No MOMs sent in this range'
                : 'From meeting held → MOM sent'
            }
            icon={Timer}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
        </div>
      </section>

      {/* Charts */}
      <section>
        <SectionHeading>Trends</SectionHeading>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MeetingsPerSamChart sams={sams} />
          <MeetingsTrendChart trend={trend} />
        </div>
      </section>

      {/* Per-SAM table */}
      <section>
        <SectionHeading>Per-SAM breakdown</SectionHeading>
        {sams.length === 0 ? (
          <div className="bg-white rounded-xl ring-1 ring-gray-200 p-8 text-center">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">No SAMs in scope</p>
            <p className="text-xs text-gray-500 mt-1">
              No SAMs report to you yet.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="bg-gray-50/60 border-b border-gray-100">
                  <tr>
                    <Th>SAM</Th>
                    <Th align="right">Held</Th>
                    <Th align="right"><span className="inline-flex items-center gap-1"><Wifi className="w-3 h-3" />Online</span></Th>
                    <Th align="right"><span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />Offline</span></Th>
                    <Th align="right">Customers met</Th>
                    <Th align="right">Avg MOM turnaround</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sams.map((s) => (
                    <tr key={s.samId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.name} />
                          <span className="text-sm font-medium text-gray-900">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums font-medium text-gray-900">
                        {s.held}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-sky-700">{s.online}</td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-indigo-700">{s.offline}</td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-gray-900">
                        {s.customersMet}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-gray-700">
                        {formatTurnaround(s.avgMomTurnaroundHours)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

/** Hours → "18h" / "1.3 days" / "—". */
function formatTurnaround(hours: number | null): string {
  if (hours === null) return '—';
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${(hours / 24).toFixed(1)} days`;
}

function rangeLabel(from?: string, to?: string): string {
  if (!from && !to) return 'all time';
  if (from && to) return `${from} → ${to}`;
  if (from) return `since ${from}`;
  return `until ${to}`;
}

function Th({
  children,
  align = 'left',
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right' | 'center';
}) {
  const alignCls =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th
      className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-900 whitespace-nowrap ${alignCls}`}
    >
      <span className={align === 'right' ? 'inline-flex justify-end w-full' : ''}>{children}</span>
    </th>
  );
}

const AVATAR_COLORS = [
  'from-rose-500 to-rose-600',
  'from-orange-500 to-orange-600',
  'from-amber-500 to-amber-600',
  'from-emerald-500 to-emerald-600',
  'from-cyan-500 to-cyan-600',
  'from-blue-500 to-blue-600',
  'from-indigo-500 to-indigo-600',
  'from-purple-500 to-purple-600',
];

function Avatar({ name }: { name: string }) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const gradient = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length === 1
      ? parts[0]!.slice(0, 2).toUpperCase()
      : (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  return (
    <div
      className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} text-white font-semibold flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow-sm text-[11px]`}
    >
      {initials}
    </div>
  );
}
