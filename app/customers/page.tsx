import { getAccounts, type OwnerFilter } from '../../services/accounts';
import { getMe } from '../../services/auth';
import { CustomersTable } from '../../components/customers-table';
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

  // Status filter (client-side since the backend doesn't accept a status query yet)
  const filtered =
    status === 'ACTIVE' ? accounts.filter((a) => a.contractStatus === 'ACTIVE') : accounts;

  // Compute the unassigned count from the current page so the chip shows a badge
  // when there's triage waiting. SAMs don't see unassigned in their scope so this
  // is naturally 0 for them.
  const unassignedCount = filtered.filter((a) => !a.samOwnerId).length;

  let subtitle = 'All accounts';
  if (filterKitty === 'BASE' && status === 'ACTIVE') subtitle = 'Current Base accounts (active)';
  else if (filterKitty === 'BASE') subtitle = 'Total Base accounts (start of period)';
  else if (filterKitty === 'NEW') subtitle = 'New accounts';
  if (filterOwner === 'unassigned') subtitle = 'Unassigned · awaiting SAM assignment';
  else if (filterOwner === 'mine') subtitle = 'Customers assigned to me';
  else if (filterOwner === 'team') subtitle = 'My team’s customers';

  return (
    <div className="px-8 py-6 max-w-7xl flex flex-col gap-4">
      <PageHeader title="Customers" subtitle={subtitle} />
      <CustomersTable
        accounts={filtered}
        currentUser={me.user}
        activeOwnerFilter={filterOwner ?? 'all'}
        unassignedCount={unassignedCount}
      />
    </div>
  );
}
