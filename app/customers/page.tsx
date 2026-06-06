import { getAccounts, type OwnerFilter } from '../../services/accounts';
import { getMe } from '../../services/auth';
import { CustomersTable } from '../../components/customers-table';
import {
  STATUS_FILTERS,
  matchesStatusFilter,
  type StatusFilter,
} from '../../lib/status-filter';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { PageHeader } from '../../components/page-header';

const OWNERS: ReadonlySet<string> = new Set(['mine', 'unassigned', 'team', 'all']);

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ kittyType?: string; status?: string; owner?: string }>;
}) {
  const { kittyType, status, owner } = await searchParams;
  const cookieHeader = await getCookieHeader();
  const filterKitty = kittyType === 'BASE' || kittyType === 'NEW' ? kittyType : undefined;
  const filterOwner: OwnerFilter | undefined =
    owner && OWNERS.has(owner) ? (owner as OwnerFilter) : undefined;
  const filterStatus: StatusFilter =
    status && (STATUS_FILTERS as readonly string[]).includes(status)
      ? (status as StatusFilter)
      : 'all';

  const [{ accounts }, me] = await Promise.all([
    getAccounts(
      {
        ...(filterKitty ? { kittyType: filterKitty } : {}),
        ...(filterOwner ? { owner: filterOwner } : {}),
      },
      { cookieHeader },
    ),
    getMe({ cookieHeader }),
  ]);

  // Status filter — client-side. Badge counts are computed over the
  // (kitty/owner)-filtered set so they reflect what the user is looking at,
  // not the whole org.
  const statusCounts: Record<StatusFilter, number> = {
    all: accounts.length,
    ACTIVE: 0,
    PENDING: 0,
    AT_RISK: 0,
    TERMINATED: 0,
    EXPIRED: 0,
  };
  for (const a of accounts) {
    for (const key of STATUS_FILTERS) {
      if (key !== 'all' && matchesStatusFilter(a.contractStatus, key)) statusCounts[key]++;
    }
  }
  const filtered =
    filterStatus === 'all'
      ? accounts
      : accounts.filter((a) => matchesStatusFilter(a.contractStatus, filterStatus));

  // Unassigned count computed BEFORE status filtering so the owner chip
  // still reflects the triage queue regardless of the current status filter.
  const unassignedCount = accounts.filter((a) => !a.samOwnerId).length;

  let subtitle = 'All accounts';
  if (filterKitty === 'BASE' && filterStatus === 'ACTIVE')
    subtitle = 'Current Base accounts (active)';
  else if (filterKitty === 'BASE') subtitle = 'Total Base accounts (start of period)';
  else if (filterKitty === 'NEW') subtitle = 'New accounts';
  if (filterOwner === 'unassigned') subtitle = 'Unassigned · awaiting SAM assignment';
  else if (filterOwner === 'mine') subtitle = 'Customers assigned to me';
  else if (filterOwner === 'team') subtitle = 'My team’s customers';

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl flex flex-col gap-4">
      <PageHeader title="Customers" subtitle={subtitle} />
      <CustomersTable
        accounts={filtered}
        currentUser={me.user}
        activeOwnerFilter={filterOwner ?? 'all'}
        unassignedCount={unassignedCount}
        activeStatusFilter={filterStatus}
        statusCounts={statusCounts}
      />
    </div>
  );
}
