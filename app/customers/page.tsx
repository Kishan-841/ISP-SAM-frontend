import { getAccounts } from '../../services/accounts';
import { CustomersTable } from '../../components/customers-table';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { PageHeader } from '../../components/page-header';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ kittyType?: string; status?: string }>;
}) {
  const { kittyType, status } = await searchParams;
  const cookieHeader = await getCookieHeader();
  const filterKitty = kittyType === 'BASE' || kittyType === 'NEW' ? kittyType : undefined;
  const { accounts } = await getAccounts(
    filterKitty ? { kittyType: filterKitty } : {},
    { cookieHeader },
  );

  // Status filter (client-side since the backend doesn't accept a status query yet)
  const filtered =
    status === 'ACTIVE' ? accounts.filter((a) => a.contractStatus === 'ACTIVE') : accounts;

  // Subtitle adjusts based on filter
  let subtitle = 'All accounts';
  if (filterKitty === 'BASE' && status === 'ACTIVE') subtitle = 'Current Base accounts (active)';
  else if (filterKitty === 'BASE') subtitle = 'Total Base accounts (start of period)';
  else if (filterKitty === 'NEW') subtitle = 'New accounts';

  return (
    <div className="px-8 py-6 max-w-7xl flex flex-col gap-4">
      <PageHeader title="Customers" subtitle={subtitle} />
      <CustomersTable accounts={filtered} />
    </div>
  );
}
