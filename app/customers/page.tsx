import { getAccounts } from '../../services/accounts';
import { CustomersTable } from '../../components/customers-table';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { PageHeader } from '../../components/page-header';

export default async function CustomersPage() {
  const cookieHeader = await getCookieHeader();
  const { accounts } = await getAccounts({}, { cookieHeader });
  return (
    <div className="px-8 py-6 max-w-7xl">
      <PageHeader title="Customers" subtitle="All accounts" />
      <CustomersTable accounts={accounts} />
    </div>
  );
}
