import type { Account } from '../services/accounts';
import { AccountRow } from './account-row';

export function AccountList({ accounts }: { accounts: Account[] }) {
  if (accounts.length === 0) {
    return <p className="text-gray-500 italic">No accounts yet.</p>;
  }
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-3 py-3 w-8" aria-label="Expand row" />
              <th className="px-3 py-3">Code</th>
              <th className="px-3 py-3">Client</th>
              <th className="px-3 py-3">Company</th>
              <th className="px-3 py-3">Plan</th>
              <th className="px-3 py-3 text-right">Bandwidth</th>
              <th className="px-3 py-3">Kitty</th>
              <th className="px-3 py-3 text-right">Current MRR</th>
              <th className="px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(a => <AccountRow key={a.id} account={a} />)}
          </tbody>
        </table>
      </div>
      <p className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-100">
        Click any row to see Circuit ID, Lead ID, ARC, meeting history, and any extra columns from the import.
      </p>
    </div>
  );
}
