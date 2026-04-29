import { getAccounts } from '../../services/accounts';
import { AccountList } from '../../components/account-list';
import { getCookieHeader } from '../../lib/get-cookie-header';

export default async function AccountsPage() {
  const cookieHeader = await getCookieHeader();
  const { accounts } = await getAccounts({}, { cookieHeader });
  return (
    <main className="max-w-6xl mx-auto p-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
        <span className="text-sm text-gray-500">{accounts.length} total</span>
      </header>
      <AccountList accounts={accounts} />
    </main>
  );
}
