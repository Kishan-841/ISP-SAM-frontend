import { getAccounts } from '../../services/accounts';
import { AccountList } from '../../components/account-list';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { PageHeader } from '../../components/page-header';

export default async function CustomersPage() {
  const cookieHeader = await getCookieHeader();
  const { accounts } = await getAccounts({}, { cookieHeader });
  return (
    <div className="px-8 py-6 max-w-7xl">
      <PageHeader
        title="Customers"
        subtitle="All accounts"
        right={<span className="text-sm text-gray-500">{accounts.length} total</span>}
      />
      <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden">
        <AccountList accounts={accounts} />
      </div>
    </div>
  );
}
