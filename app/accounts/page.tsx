import { getAccounts } from '../../services/accounts';
import { AccountList } from '../../components/account-list';

export default async function AccountsPage() {
  const { accounts } = await getAccounts();
  return (
    <main className="max-w-6xl mx-auto p-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <span className="text-sm text-gray-500">{accounts.length} total</span>
      </header>
      <AccountList accounts={accounts} />
    </main>
  );
}
