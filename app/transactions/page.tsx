import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  XCircle,
  ListChecks,
  Upload,
} from 'lucide-react';
import { getCommercialChanges } from '../../services/commercial-changes';
import { getMe } from '../../services/auth';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { PageHeader } from '../../components/page-header';
import { TransactionsTable } from '../../components/transactions-table';

const VALID_TYPES = ['UPGRADE', 'DOWNGRADE', 'RATE_REVISION', 'DISCONNECTION'] as const;
type ValidType = (typeof VALID_TYPES)[number];

const META: Record<ValidType, { label: string; subtitle: string }> = {
  UPGRADE: { label: 'Upgrades', subtitle: 'ARC added' },
  DOWNGRADE: { label: 'Downgrades', subtitle: 'ARC reduced' },
  RATE_REVISION: { label: 'Rate Revisions', subtitle: 'Bandwidth uplift at the same ARC' },
  DISCONNECTION: { label: 'Disconnections', subtitle: 'ARC lost' },
};

type Chip = {
  key: ValidType | 'ALL';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: { bg: string; text: string; ring: string };
};

const CHIPS: Chip[] = [
  {
    key: 'ALL',
    label: 'All',
    icon: ListChecks,
    active: { bg: 'bg-gray-900', text: 'text-white', ring: 'ring-gray-900' },
  },
  {
    key: 'UPGRADE',
    label: 'Upgrades',
    icon: TrendingUp,
    active: { bg: 'bg-emerald-600', text: 'text-white', ring: 'ring-emerald-600' },
  },
  {
    key: 'DOWNGRADE',
    label: 'Downgrades',
    icon: TrendingDown,
    active: { bg: 'bg-amber-500', text: 'text-white', ring: 'ring-amber-500' },
  },
  {
    key: 'RATE_REVISION',
    label: 'Rate Revisions',
    icon: ArrowUpDown,
    active: { bg: 'bg-violet-600', text: 'text-white', ring: 'ring-violet-600' },
  },
  {
    key: 'DISCONNECTION',
    label: 'Disconnections',
    icon: XCircle,
    active: { bg: 'bg-red-600', text: 'text-white', ring: 'ring-red-600' },
  },
];

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const validType: ValidType | undefined =
    type && (VALID_TYPES as readonly string[]).includes(type) ? (type as ValidType) : undefined;

  const cookieHeader = await getCookieHeader();
  // Always pull the full set so the chip badges can show counts; filter
  // client-rendered list off `validType`. Cheap because /commercial-changes
  // is paginated upstream of large volumes.
  const [{ changes: allChanges }, me] = await Promise.all([
    getCommercialChanges({}, { cookieHeader }),
    getMe({ cookieHeader }).catch(() => null),
  ]);
  const isAdmin = me?.user?.role === 'ADMIN';
  const changes = validType
    ? allChanges.filter((c) => c.changeType === validType)
    : allChanges;

  // Counts per type for the chip badges.
  const counts: Record<ValidType | 'ALL', number> = {
    ALL: allChanges.length,
    UPGRADE: 0,
    DOWNGRADE: 0,
    RATE_REVISION: 0,
    DISCONNECTION: 0,
  };
  for (const c of allChanges) counts[c.changeType] += 1;

  const title = validType ? META[validType].label : 'All Commercial Changes';
  const subtitle = validType ? META[validType].subtitle : 'Audit trail of every commercial change';

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl flex flex-col gap-4">
      <PageHeader
        title={title}
        subtitle={subtitle}
        right={
          isAdmin ? (
            <Link
              href="/transactions/bulk-import"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-brand-600 text-white hover:bg-brand-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Bulk import
            </Link>
          ) : undefined
        }
      />

      {/* Type filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {CHIPS.map((chip) => {
          const Icon = chip.icon;
          const isActive = chip.key === 'ALL' ? !validType : validType === chip.key;
          const count = counts[chip.key];
          const href = chip.key === 'ALL' ? '/transactions' : `/transactions?type=${chip.key}`;
          return (
            <Link
              key={chip.key}
              href={href}
              className={
                isActive
                  ? `inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ring-1 ${chip.active.bg} ${chip.active.text} ${chip.active.ring}`
                  : 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all'
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {chip.label}
              <span
                className={
                  isActive
                    ? 'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-white/20 text-white'
                    : 'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600'
                }
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      <TransactionsTable changes={changes} />
    </div>
  );
}
