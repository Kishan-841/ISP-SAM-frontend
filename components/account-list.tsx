import type { Account } from '../services/accounts';
import { AccountRow } from './account-row';

export function AccountList({ accounts }: { accounts: Account[] }) {
  if (accounts.length === 0) {
    return <p className="text-gray-500 italic">No accounts yet.</p>;
  }
  return (
    <table className="w-full">
      <thead className="text-left text-sm text-gray-600 border-b">
        <tr>
          <th className="px-4 py-2">Client</th>
          <th className="px-4 py-2">Kitty</th>
          <th className="px-4 py-2 text-right">Current MRR</th>
          <th className="px-4 py-2">Contract</th>
          <th className="px-4 py-2">Last Meeting</th>
        </tr>
      </thead>
      <tbody>
        {accounts.map(a => <AccountRow key={a.id} account={a} />)}
      </tbody>
    </table>
  );
}
